// 드라이브 파일(스크립트, 스프레드시트) 만들기와 찾기
import { S, emit } from './state.js';
import { uid, randStr } from './util.js';
import { DEFAULT_GS } from './codegen.js';

export function createScript({ bound = null } = {}) {
  const id = '1' + randStr(43, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-');
  const sc = {
    id,
    name: '제목 없는 프로젝트',
    files: [{ name: 'Code', type: 'gs', content: DEFAULT_GS, saved: DEFAULT_GS }],
    activeFile: 'Code',
    view: 'editor',
    props: {},
    deployments: [],
    versions: [],
    authorized: [],
    bound,
    created: Date.now(),
  };
  S.L.scripts[id] = sc;
  S.L.mainScript = id;
  if (bound && S.L.sheets[bound]) S.L.sheets[bound].scriptId = id;
  emit('script:created', { id, bound });
  return sc;
}

export function createSheet() {
  const id = '1' + randStr(43, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-');
  const sh = { id, name: '제목 없는 스프레드시트', tabs: { 시트1: [] }, order: ['시트1'], active: '시트1', scriptId: null, created: Date.now() };
  S.L.sheets[id] = sh;
  S.L.mainSheet = id;
  emit('sheet:created', { id });
  return sh;
}

export const getScript = (id) => S.L.scripts[id] || null;
export const getSheet = (id) => S.L.sheets[id] || null;
export const mainScript = () => getScript(S.L.mainScript);
export const mainSheet = () => getSheet(S.L.mainSheet);

export function scriptUrl(sc) {
  return `https://script.google.com/u/0/home/projects/${sc.id}/edit`;
}
export function sheetUrl(sh) {
  return `https://docs.google.com/spreadsheets/d/${sh.id}/edit`;
}
export function execUrl(dep) {
  return `https://script.google.com/macros/s/${dep.id}/exec`;
}
export function devUrl(sc) {
  return `https://script.google.com/macros/s/${sc.id}/dev`;
}

export function findDeployment(depId) {
  for (const sc of Object.values(S.L.scripts)) {
    const d = sc.deployments.find((x) => x.id === depId);
    if (d) return { sc, dep: d };
  }
  return null;
}

export function fileLabel(f) {
  return f.name + (f.type === 'gs' ? '.gs' : '.html');
}
export const _uid = uid;
