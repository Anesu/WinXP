// ── MailStore ───────────────────────────────────────────────
function createMailStore() {
  if (!Array.isArray(fs.mails)) fs.mails = defaultFS().mails.slice();
  if (!Array.isArray(fs.mailCategories)) fs.mailCategories = [];
  const save = saveFilesystem;
  const LOCKED = new Set(['Personal', 'Work']);
  return {
    add(data) {
      const mail = { id: 'm' + Date.now(), type: data.type || 'email', category: data.category || 'Personal', title: data.title || '', subject: data.subject || '', body: data.body || '', created: Date.now(), updated: Date.now() };
      fs.mails.push(mail);
      save();
      return mail;
    },
    update(id, data) {
      const mail = fs.mails.find(m => m.id === id);
      if (!mail) return null;
      ['type', 'category', 'title', 'subject', 'body'].forEach(k => { if (data[k] !== undefined) mail[k] = data[k]; });
      mail.updated = Date.now();
      save();
      return mail;
    },
    remove(id) {
      const idx = fs.mails.findIndex(m => m.id === id);
      if (idx === -1) return null;
      const [removed] = fs.mails.splice(idx, 1);
      save();
      return removed;
    },
    get(id) { return fs.mails.find(m => m.id === id) || null; },
    all() { return fs.mails.slice(); },
    byCategory(cat) { return fs.mails.filter(m => m.category === cat); },
    search(q) {
      const lq = q.toLowerCase();
      return fs.mails.filter(m => m.title.toLowerCase().includes(lq) || m.subject.toLowerCase().includes(lq) || m.body.toLowerCase().includes(lq) || m.category.toLowerCase().includes(lq));
    },
    categories() {
      const customCats = fs.mailCategories || [];
      return ['All', ...customCats, ...LOCKED];
    },
    customCategories() {
      return fs.mailCategories ? fs.mailCategories.slice() : [];
    },
    addCategory(name) {
      if (LOCKED.has(name)) return false;
      if (!fs.mailCategories) fs.mailCategories = [];
      if (fs.mailCategories.includes(name)) return false;
      fs.mailCategories.push(name);
      save();
      return true;
    },
    deleteCategory(name) {
      if (LOCKED.has(name)) return false;
      fs.mailCategories = (fs.mailCategories || []).filter(c => c !== name);
      // Reassign templates in this category to Personal
      fs.mails.forEach(m => { if (m.category === name) m.category = 'Personal'; });
      save();
      return true;
    },
    isLockedCategory(name) { return LOCKED.has(name); },
    categoryCounts() {
      const counts = {};
      this.categories().forEach(c => counts[c] = 0);
      fs.mails.forEach(m => counts[m.category] = (counts[m.category] || 0) + 1);
      return counts;
    },
  };
}
