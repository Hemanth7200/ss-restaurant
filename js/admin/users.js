/* ============================================
   SS Restaurant — Admin Users
   ============================================ */

function renderAdminUsers() {
  renderAdminLayout('Admin Users', (container) => {
    function render() {
      const users = Store.get('adminUsers');

      container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-xl);">
          <p style="color:var(--text-muted);font-size:var(--font-size-sm);">${users.length} admin user${users.length !== 1 ? 's' : ''}</p>
          <button class="btn btn-primary" id="add-user-btn">+ Add User</button>
        </div>

        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(u => `
                <tr>
                  <td><strong>${Utils.escapeHtml(u.name)}</strong></td>
                  <td>${Utils.escapeHtml(u.email)}</td>
                  <td><span class="badge badge-primary">${u.role}</span></td>
                  <td>
                    <div class="table-actions">
                      <button class="btn btn-sm btn-ghost" onclick="editUser('${u.id}')">✏️</button>
                      <button class="btn btn-sm btn-ghost" onclick="deleteUser('${u.id}')">🗑️</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      document.getElementById('add-user-btn').addEventListener('click', () => showUserModal());
    }

    render();
    window._refreshAdminUsers = render;
  });
}

function showUserModal(editId) {
  const user = editId ? Store.get('adminUsers').find(u => u.id === editId) : null;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>${user ? 'Edit' : 'Add'} Admin User</h3>
        <button class="modal-close" id="modal-close-btn">✕</button>
      </div>
      <div class="modal-body">
        <div class="details-form">
          <div class="form-group">
            <label class="form-label">Full Name *</label>
            <input type="text" id="usr-name" class="form-input" value="${user ? Utils.escapeHtml(user.name) : ''}" />
          </div>
          <div class="form-group">
            <label class="form-label">Email *</label>
            <input type="email" id="usr-email" class="form-input" value="${user ? Utils.escapeHtml(user.email) : ''}" />
          </div>
          <div class="form-group">
            <label class="form-label">${user ? 'New Password (leave blank to keep current)' : 'Password *'}</label>
            <input type="password" id="usr-password" class="form-input" placeholder="${user ? 'Leave blank to keep current' : 'Enter password'}" />
          </div>
          <div class="form-group">
            <label class="form-label">Role</label>
            <select id="usr-role" class="form-input">
              <option value="Admin" ${user && user.role === 'Admin' ? 'selected' : ''}>Admin</option>
              <option value="Manager" ${user && user.role === 'Manager' ? 'selected' : ''}>Manager</option>
              <option value="Staff" ${user && user.role === 'Staff' ? 'selected' : ''}>Staff</option>
            </select>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="modal-cancel-btn">Cancel</button>
        <button class="btn btn-primary" id="modal-save-btn">${user ? 'Save' : 'Add User'}</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.querySelector('#modal-close-btn').addEventListener('click', close);
  overlay.querySelector('#modal-cancel-btn').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  overlay.querySelector('#modal-save-btn').addEventListener('click', () => {
    const name = document.getElementById('usr-name').value.trim();
    const email = document.getElementById('usr-email').value.trim();
    const password = document.getElementById('usr-password').value;
    const role = document.getElementById('usr-role').value;

    if (!name || !email) { Toast.error('Name and email are required'); return; }
    if (!user && !password) { Toast.error('Password is required for new users'); return; }

    if (user) {
      const updated = { ...user, name, email, role, password: password || user.password };
      Store.update('adminUsers', users => users.map(u =>
        u.id === editId ? updated : u
      ));
      DB.upsertAdminUser(updated);
      Toast.success('User updated');
    } else {
      const newUser = { id: Utils.generateId('admin'), name, email, password, role };
      Store.update('adminUsers', users => [...users, newUser]);
      DB.upsertAdminUser(newUser);
      Toast.success('User added');
    }

    close();
    if (window._refreshAdminUsers) window._refreshAdminUsers();
  });
}

function editUser(id) { showUserModal(id); }

function deleteUser(id) {
  const users = Store.get('adminUsers');
  if (users.length <= 1) {
    Toast.error('Cannot delete the last admin user');
    return;
  }
  if (confirm('Delete this admin user?')) {
    Store.update('adminUsers', users => users.filter(u => u.id !== id));
    DB.deleteAdminUser(id);
    Toast.success('User deleted');
    if (window._refreshAdminUsers) window._refreshAdminUsers();
  }
}
