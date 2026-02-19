const fs = require('fs');
const path = require('path');

function readAllFiles(dir, exts) {
  const results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      // Skip node_modules and other common large folders
      if (file === 'node_modules' || file === '.git') return;
      results.push(...readAllFiles(full, exts));
    } else {
      if (exts.includes(path.extname(full))) results.push(full);
    }
  });
  return results;
}

function find() {
  const root = path.resolve(__dirname, '..');
  const files = readAllFiles(root, ['.js', '.jsx']);
  const importMap = new Map();
  files.forEach(file => {
    const txt = fs.readFileSync(file, 'utf8');
    const importRegex = /import\s+([\s\S]+?)\s+from\s+['"].+?['"];?/g;
    let m;
    const imports = [];
    while ((m = importRegex.exec(txt)) !== null) {
      imports.push(m[1].trim());
    }
    if (imports.length === 0) return;
    const ids = new Set();
    imports.forEach(imp => {
      // default import: foo
      const defaultMatch = /^([A-Za-z_$][A-Za-z0-9_$]*)$/.exec(imp);
      if (defaultMatch) ids.add(defaultMatch[1]);
      // named imports: { a, b as c }
      const namedMatch = /^{([\s\S]+)}$/.exec(imp);
      if (namedMatch) {
        namedMatch[1].split(',').forEach(part => {
          const p = part.trim();
          const asMatch = /as\s+([A-Za-z_$][A-Za-z0-9_$]*)$/.exec(p);
          if (asMatch) ids.add(asMatch[1]);
          else {
            const id = /([A-Za-z_$][A-Za-z0-9_$]*)/.exec(p);
            if (id) ids.add(id[1]);
          }
        });
      }
      // namespace import: * as ns
      const starMatch = /^\*\s+as\s+([A-Za-z_$][A-Za-z0-9_$]*)$/.exec(imp);
      if (starMatch) ids.add(starMatch[1]);
    });

    if (ids.size > 0) importMap.set(file, Array.from(ids));
  });

  const problems = [];
  for (const [file, ids] of importMap.entries()) {
    const txt = fs.readFileSync(file, 'utf8');
        ids.forEach(id => {
          const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const assignRegex = new RegExp('(^|[^A-Za-z0-9_$])' + escaped + '\\s*([+]{2}|[-]{2}|=|\\+=|-=|\\*=|/=)', 'm');
          if (assignRegex.test(txt)) {
            const lines = txt.split(/\r?\n/);
            lines.forEach((line, idx) => {
              if (assignRegex.test(line)) {
                problems.push({file, line: idx+1, code: line.trim(), id});
              }
            });
          }
        });
  }

  if (problems.length === 0) {
    console.log('No assignments to imported identifiers found.');
  } else {
    console.log('Potential assignments to imported identifiers:');
    problems.forEach(p => console.log(`${p.file}:${p.line} -> ${p.id} :: ${p.code}`));
  }
}

find();
