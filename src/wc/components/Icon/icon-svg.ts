import sax, { type QualifiedTag } from 'sax';

const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';
const ID = /^[A-Za-z_][\w.-]*$/;
const LOCAL_PAINT = /^url\(\s*(['"]?)#([A-Za-z_][\w.-]*)\1\s*\)$/;
const PAINT =
  /^(?:none|currentColor|transparent|[a-z]+|#[\da-f]{3,8}|(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch)\([-+.\d\s,%/]+\)|color\((?:display-p3|srgb|srgb-linear|a98-rgb|prophoto-rgb|rec2020|xyz|xyz-d50|xyz-d65)\s+[-+.\d\s%/]+\))$/i;
const ELEMENTS = new Set([
  'svg',
  'g',
  'defs',
  'path',
  'rect',
  'circle',
  'ellipse',
  'line',
  'polyline',
  'polygon',
  'linearGradient',
  'radialGradient',
  'stop',
  'clipPath',
  'mask',
  'use',
  'title',
  'desc',
]);
const PAINT_ATTRIBUTES = new Set(['fill', 'stroke', 'color', 'stop-color']);
const PRESENTATION = new Set([
  ...PAINT_ATTRIBUTES,
  'opacity',
  'fill-opacity',
  'stroke-opacity',
  'stop-opacity',
  'fill-rule',
  'clip-rule',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-miterlimit',
  'stroke-dasharray',
  'stroke-dashoffset',
  'vector-effect',
]);
const ATTRIBUTES = new Set([
  ...PRESENTATION,
  'id',
  'style',
  'xmlns',
  'xmlns:xlink',
  'href',
  'xlink:href',
  'viewBox',
  'preserveAspectRatio',
  'transform',
  'x',
  'y',
  'x1',
  'y1',
  'x2',
  'y2',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'width',
  'height',
  'd',
  'points',
  'pathLength',
  'gradientUnits',
  'gradientTransform',
  'spreadMethod',
  'offset',
  'fx',
  'fy',
  'fr',
  'clipPathUnits',
  'maskUnits',
  'maskContentUnits',
  'clip-path',
  'mask',
]);

export interface IconSvgNode {
  name: string;
  attributes: Record<string, string>;
  styles: [string, string][];
  children: IconSvgNode[];
  text: string;
}

function paintReference(value: string): string | undefined {
  return value.match(LOCAL_PAINT)?.[2];
}

function validPresentation(name: string, value: string): boolean {
  if (PAINT_ATTRIBUTES.has(name)) return PAINT.test(value) || !!paintReference(value);
  // Static presentation only: no escapes, comments, variables or priorities.
  return /^[\w\s.,%+-]+$/.test(value);
}

function parseStyles(value: string): [string, string][] | null {
  const entries: [string, string][] = [];
  for (const declaration of value.split(';')) {
    if (!declaration.trim()) continue;
    const colon = declaration.indexOf(':');
    const name = declaration.slice(0, colon).trim();
    const paint = declaration.slice(colon + 1).trim();
    if (colon < 0 || !PRESENTATION.has(name) || !validPresentation(name, paint)) return null;
    // Preserve ordered fallback paints, including IcoMo's display-p3 colors.
    entries.push([name, paint]);
  }
  return entries;
}

/** Parse a bounded static glyph into data, without touching a browser markup sink. */
export function parseIconSvgTree(svg: string): IconSvgNode | null {
  if (typeof svg !== 'string' || svg.length > 131072) return null;
  const stack: IconSvgNode[] = [];
  const ids = new Map<string, IconSvgNode>();
  const references = new Map<IconSvgNode, string[]>();
  let root: IconSvgNode | undefined;
  let count = 0;
  function reject(): never {
    throw new Error('Unsupported icon SVG');
  }
  // sax supports strictEntities; its separately published types omit this option.
  const options: sax.SAXOptions & { strictEntities: boolean } = {
    xmlns: true,
    strictEntities: true,
    position: false,
  };
  const xml = sax.parser(true, options);
  // sax reports repeated attributes separately in namespace mode. Do not let
  // its last value silently replace malformed input accepted by the validator.
  const attributeNames = new Set<string>();
  xml.onopentagstart = () => attributeNames.clear();
  xml.onattribute = attribute => {
    if (attributeNames.has(attribute.name)) reject();
    attributeNames.add(attribute.name);
  };
  xml.onerror = reject;
  xml.ondoctype = reject;
  xml.onprocessinginstruction = reject;
  xml.onsgmldeclaration = reject;
  xml.onopencdata = reject;
  xml.onopentag = rawTag => {
    const tag = rawTag as QualifiedTag;
    if (
      ++count > 1024 ||
      stack.length >= 32 ||
      !ELEMENTS.has(tag.name) ||
      tag.prefix ||
      (tag.uri && tag.uri !== SVG_NS)
    )
      reject();
    if (!stack.length && (root || tag.name !== 'svg')) reject();
    const node: IconSvgNode = {
      name: tag.name,
      attributes: Object.create(null),
      styles: [],
      children: [],
      text: '',
    };
    const refs: string[] = [];
    references.set(node, refs);
    for (const { name, value } of Object.values(tag.attributes)) {
      if (!ATTRIBUTES.has(name)) reject();
      const trimmed = value.trim();
      if (name === 'xmlns') {
        if (value !== SVG_NS) reject();
      } else if (name === 'xmlns:xlink') {
        if (value !== XLINK_NS) reject();
      } else if (name === 'id') {
        if (!ID.test(value) || ids.has(value)) reject();
        ids.set(value, node);
      } else if (name === 'style') {
        const styles = parseStyles(value);
        if (!styles) reject();
        node.styles = styles;
        for (const [, paint] of node.styles) {
          const reference = paintReference(paint);
          if (reference) refs.push(reference);
        }
      } else if (name === 'href' || name === 'xlink:href') {
        if (
          !['use', 'linearGradient', 'radialGradient'].includes(tag.name) ||
          !trimmed.startsWith('#') ||
          !ID.test(trimmed.slice(1))
        )
          reject();
        refs.push(trimmed.slice(1));
      } else if (name === 'clip-path' || name === 'mask') {
        if (trimmed !== 'none' && !paintReference(trimmed)) reject();
        const reference = paintReference(trimmed);
        if (reference) refs.push(reference);
      } else if (PRESENTATION.has(name)) {
        if (!validPresentation(name, trimmed)) reject();
        const reference = paintReference(trimmed);
        if (reference) refs.push(reference);
      } else if (!/^[\w\s.,%()+-]*$/.test(value)) reject();
      node.attributes[name] = trimmed;
    }
    if (stack.length) stack[stack.length - 1].children.push(node);
    else root = node;
    stack.push(node);
  };
  xml.onclosetag = () => {
    stack.pop();
  };
  xml.ontext = text => {
    const node = stack[stack.length - 1];
    if (node && (node.name === 'title' || node.name === 'desc')) node.text += text;
    else if (text.trim()) reject();
  };
  try {
    xml.write(svg).close();
    if (!root || stack.length) return null;
    // Resolve inside this glyph, never against surrounding page IDs. Reject
    // cycles and bound expansion, including <use> referencing an ancestor.
    let visits = 0;
    const active = new Set<IconSvgNode>();
    const visit = (node: IconSvgNode, depth: number) => {
      if (++visits > 4096 || depth > 64 || active.has(node)) reject();
      active.add(node);
      for (const child of node.children) visit(child, depth + 1);
      for (const id of references.get(node) ?? []) {
        const target = ids.get(id);
        if (!target) reject();
        visit(target, depth + 1);
      }
      active.delete(node);
    };
    visit(root, 0);
    return root;
  } catch {
    return null;
  }
}

const SEQUENCE = Symbol.for('ds-mo.icon-svg-sequence');

/** Construct validated SVG with namespaced DOM APIs, without a Trusted Types policy. */
export function parseIconSvg(svg: string, ownerDocument?: Document): SVGElement | null {
  const doc = ownerDocument ?? (typeof document === 'undefined' ? undefined : document);
  if (!doc) return null;
  const tree = parseIconSvgTree(svg);
  if (!tree) return null;
  const shared = globalThis as typeof globalThis & { [SEQUENCE]?: number };
  const prefix = 'ds-icon-' + (shared[SEQUENCE] = (shared[SEQUENCE] ?? 0) + 1) + '-';
  const rewrite = (value: string) => {
    const reference = paintReference(value);
    return reference ? 'url(#' + prefix + reference + ')' : value;
  };
  const create = (node: IconSvgNode): SVGElement => {
    const element = doc.createElementNS(SVG_NS, node.name);
    for (const [name, value] of Object.entries(node.attributes)) {
      if (name === 'style' || name.startsWith('xmlns')) continue;
      if (name === 'id') element.id = prefix + value;
      else if (name === 'href' || name === 'xlink:href') {
        element.setAttributeNS(
          name === 'xlink:href' ? XLINK_NS : null,
          name,
          '#' + prefix + value.slice(1)
        );
      } else element.setAttribute(name, rewrite(value));
    }
    for (const [name, value] of node.styles) element.style.setProperty(name, rewrite(value));
    if (node.text) element.appendChild(doc.createTextNode(node.text));
    for (const child of node.children) element.appendChild(create(child));
    return element;
  };
  return create(tree);
}
