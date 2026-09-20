import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { parseIconSvgTree, parseIconSvg } from '../src/wc/components/Icon/icon-svg.ts';

const glyph = (content: string, attributes = '') =>
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ' +
  attributes +
  '>' +
  content +
  '</svg>';

describe('static icon SVG boundary', () => {
  it('accepts every installed IcoMo glyph, preserving paint fallbacks', async () => {
    const require = createRequire(import.meta.url);
    const metadata = JSON.parse(fs.readFileSync(require.resolve('@ds-mo/icons/meta.json'), 'utf8'));
    for (const icon of metadata.icons) {
      const category = icon.category === 'flag' ? 'flags/' : icon.category === 'map' ? 'map/' : '';
      const svg = (await import('@ds-mo/icons/svg/' + category + icon.name))[icon.name];
      assert.ok(parseIconSvgTree(svg), icon.name);
    }
    const tree = parseIconSvgTree(
      glyph(
        '<path style="fill:#fff;fill:color(display-p3 1 1 1);fill-opacity:1;" d="M0 0h24v24z"/>'
      )
    );
    assert.deepEqual(tree?.children[0].styles, [
      ['fill', '#fff'],
      ['fill', 'color(display-p3 1 1 1)'],
      ['fill-opacity', '1'],
    ]);
  });

  it('accepts local gradients, clipping, masks, use and escaped descriptive text', () => {
    assert.ok(
      parseIconSvgTree(
        glyph(
          '<defs><linearGradient id="paint"><stop offset="0" stop-color="#fff"/></linearGradient><clipPath id="clip"><rect width="10" height="10"/></clipPath><mask id="mask"><path d="M0 0h24v24z" fill="white"/></mask><path id="shape" d="M0 0h24v24z"/></defs><use href="#shape" fill="url(#paint)" clip-path="url(#clip)" mask="url(#mask)"/><title>A &amp; B</title>'
        )
      )
    );
    assert.ok(parseIconSvgTree('<svg><path d="M0 0h24v24z"/></svg>'));
  });

  const rejected = [
    '<div/>',
    '<svg/><svg/>',
    '<svg><path></svg>',
    '<svg width=24/>',
    '<svg width="24" width="48"/>',
    glyph('<path fill="red" fill="blue"/>'),
    glyph('<use href="#a" href="#b"/><path id="a"/><path id="b"/>'),
    '<svg xmlns="http://www.w3.org/1999/xhtml"/>',
    '<svg xmlns:other="http://example.com"><other:path/></svg>',
    '<?xml-stylesheet href="https://example.invalid/a.css"?><svg/>',
    '<!DOCTYPE svg [<!ENTITY x SYSTEM "https://example.invalid/x">]><svg/>',
    glyph('<script>alert(1)</script>'),
    glyph('<foreignObject><div/></foreignObject>'),
    glyph('<style>body {display:none}</style>'),
    glyph('<animate attributeName="href" to="https://example.invalid"/>'),
    glyph('<set attributeName="fill" to="url(https://example.invalid)"/>'),
    glyph('<image href="https://example.invalid"/>'),
    glyph('<a href="#x"><path id="x"/></a>'),
    glyph('<path onload="alert(1)"/>'),
    glyph('<path ONERROR="alert(1)"/>'),
    glyph('<path fill="url(https://example.invalid/paint)"/>'),
    glyph('<path fill="url(&#104;ttps://example.invalid/paint)"/>'),
    glyph('<path style="fill:u\\72l(https://example.invalid)"/>'),
    glyph('<path style="fill:var(--untrusted-paint)"/>'),
    glyph('<path style="fill:red;position:fixed"/>'),
    glyph('<path style="fill:red!important"/>'),
    glyph('<path style="fill:/**/red"/>'),
    glyph('<path style="--paint:red;fill:red"/>'),
    glyph('<use href="javascript:alert(1)"/>'),
    glyph('<use href="data:image/svg+xml,x"/>'),
    glyph('<use href="#page-owned-id"/>'),
    glyph('<path fill="url(#page-owned-id)"/>'),
    glyph('<path id="duplicate"/><path id="duplicate"/>'),
    glyph('<g id="loop"><use href="#loop"/></g>'),
    glyph('<defs><linearGradient id="a" href="#b"/><linearGradient id="b" href="#a"/></defs>'),
    glyph('<path xmlns=""/>'),
    glyph('<![CDATA[arbitrary markup]]>'),
    glyph('<path/>&unknown;'),
    '<svg>' + '<g>'.repeat(33) + '</g>'.repeat(33) + '</svg>',
    glyph('<path/>'.repeat(1025)),
    glyph(' '.repeat(131073)),
  ];
  for (const svg of rejected) {
    it('rejects ' + svg.slice(0, 100), () => assert.equal(parseIconSvgTree(svg), null));
  }
  it('bounds repeated reference expansion and remains server safe', () => {
    let nodes = '<g id="n0"><path/></g>';
    for (let i = 1; i < 13; i++)
      nodes +=
        '<g id="n' + i + '"><use href="#n' + (i - 1) + '"/><use href="#n' + (i - 1) + '"/></g>';
    assert.equal(parseIconSvgTree(glyph(nodes)), null);
    assert.equal(parseIconSvg(glyph('<path/>')), null);
    assert.equal(parseIconSvgTree(null as unknown as string), null);
  });
});
