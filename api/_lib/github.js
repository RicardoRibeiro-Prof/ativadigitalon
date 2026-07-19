const API_ROOT = 'https://api.github.com';

function repository() {
  return process.env.GITHUB_REPOSITORY || 'RicardoRibeiro-Prof/ativadigitalon';
}

function branch() {
  return process.env.GITHUB_BRANCH || 'main';
}

async function request(path, options = {}) {
  if (!process.env.GITHUB_TOKEN) throw new Error('GITHUB_TOKEN não configurado na Vercel.');
  const response = await fetch(`${API_ROOT}${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'Ativa-Digital-ON-Admin',
      ...(options.headers || {})
    }
  });

  if (response.status === 404) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.message || `Falha na comunicação com o GitHub (${response.status}).`;
    throw new Error(message);
  }
  return data;
}

function contentPath(path) {
  return `/repos/${repository()}/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(branch())}`;
}

async function getFile(path) {
  const data = await request(contentPath(path));
  if (!data || Array.isArray(data)) return null;
  return {
    path,
    sha: data.sha,
    content: Buffer.from(String(data.content || '').replace(/\n/g, ''), 'base64').toString('utf8')
  };
}

async function getBinaryFile(path) {
  const data = await request(contentPath(path));
  if (!data || Array.isArray(data)) return null;
  return {
    path,
    sha: data.sha,
    content: Buffer.from(String(data.content || '').replace(/\n/g, ''), 'base64')
  };
}

async function getDirectory(path) {
  const data = await request(contentPath(path));
  if (!Array.isArray(data)) return [];
  return data;
}

async function writeFile(path, content, message) {
  const current = await getBinaryFile(path);
  const body = {
    message,
    content: Buffer.isBuffer(content) ? content.toString('base64') : Buffer.from(String(content)).toString('base64'),
    branch: branch()
  };
  if (current?.sha) body.sha = current.sha;

  return request(`/repos/${repository()}/contents/${path.split('/').map(encodeURIComponent).join('/')}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

async function deleteFile(path, message) {
  const current = await getBinaryFile(path);
  if (!current) return null;
  return request(`/repos/${repository()}/contents/${path.split('/').map(encodeURIComponent).join('/')}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sha: current.sha, branch: branch() })
  });
}

async function commitFiles(changes, message) {
  const repo = repository();
  const branchName = branch();
  const reference = await request(`/repos/${repo}/git/ref/heads/${encodeURIComponent(branchName)}`);
  if (!reference?.object?.sha) throw new Error('Não foi possível localizar a branch de publicação.');

  const parentSha = reference.object.sha;
  const parentCommit = await request(`/repos/${repo}/git/commits/${parentSha}`);
  const treeEntries = [];

  for (const change of changes) {
    if (change.content === null) {
      treeEntries.push({ path: change.path, mode: '100644', type: 'blob', sha: null });
      continue;
    }
    const buffer = Buffer.isBuffer(change.content) ? change.content : Buffer.from(String(change.content));
    const blob = await request(`/repos/${repo}/git/blobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: buffer.toString('base64'), encoding: 'base64' })
    });
    treeEntries.push({ path: change.path, mode: '100644', type: 'blob', sha: blob.sha });
  }

  const tree = await request(`/repos/${repo}/git/trees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base_tree: parentCommit.tree.sha, tree: treeEntries })
  });
  const commit = await request(`/repos/${repo}/git/commits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, tree: tree.sha, parents: [parentSha] })
  });
  await request(`/repos/${repo}/git/refs/heads/${encodeURIComponent(branchName)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sha: commit.sha, force: false })
  });
  return commit;
}

async function getManifest() {
  const file = await getFile('content/posts.json');
  if (!file) return { version: 1, updatedAt: new Date().toISOString(), posts: [] };
  return JSON.parse(file.content);
}

module.exports = {
  commitFiles,
  deleteFile,
  getDirectory,
  getFile,
  getManifest,
  repository,
  writeFile
};
