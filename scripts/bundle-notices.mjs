import fs from 'node:fs';
import path from 'node:path';

/** Derive notices from actual bundle inputs, including nested dependency installs. */
export function writeBundleNotices({ inputs, root, output, preamble = '' }) {
  const directories = new Set();
  for (const input of inputs) {
    const absolute = path.resolve(root, input);
    const marker = `${path.sep}node_modules${path.sep}`;
    const index = absolute.lastIndexOf(marker);
    if (index === -1) continue;
    const parts = absolute.slice(index + marker.length).split(path.sep);
    const packageParts = parts.slice(0, parts[0].startsWith('@') ? 2 : 1);
    directories.add(path.join(absolute.slice(0, index), 'node_modules', ...packageParts));
  }

  const packages = [...directories]
    .map(directory => {
      const { name, version, license, licenses } = JSON.parse(
        fs.readFileSync(path.join(directory, 'package.json'), 'utf8')
      );
      const files = fs
        .readdirSync(directory, { withFileTypes: true })
        .filter(
          entry => entry.isFile() && /^(?:licen[cs]e|copying|notice)(?:[._-].*)?$/i.test(entry.name)
        )
        .map(entry => entry.name)
        .sort();
      if (
        !name ||
        !version ||
        !files.some(file => /^(?:licen[cs]e|copying)(?:[._-].*)?$/i.test(file))
      ) {
        throw new Error(`Missing bundled dependency identity or license: ${directory}`);
      }
      return {
        name,
        version,
        license: license ?? licenses ?? 'UNSPECIFIED',
        files,
        notices: files
          .map(file => `${file}\n${fs.readFileSync(path.join(directory, file), 'utf8')}`)
          .join('\n\n'),
      };
    })
    .sort((a, b) => `${a.name}@${a.version}`.localeCompare(`${b.name}@${b.version}`, 'en'));

  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(
    path.join(output, 'THIRD-PARTY-NOTICES'),
    [
      preamble.trim(),
      ...packages.map(
        pkg =>
          `${pkg.name}@${pkg.version}\nLicense: ${typeof pkg.license === 'string' ? pkg.license : JSON.stringify(pkg.license)}\n\n${pkg.notices}`
      ),
    ]
      .filter(Boolean)
      .join('\n\n') + '\n'
  );
  fs.writeFileSync(
    path.join(output, 'bundled-dependencies.json'),
    JSON.stringify(
      {
        schemaVersion: 1,
        packages: packages.map(({ notices, ...metadata }) => metadata),
      },
      null,
      2
    ) + '\n'
  );
}
