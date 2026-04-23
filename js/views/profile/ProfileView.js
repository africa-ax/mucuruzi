// ============================================================
//  MUCURUZI — ProfileView.js
//  User's own profile page with edit capability.
// ============================================================

const ProfileView = (() => {

  let _editing = false;

  const render = (user, root) => {
    _editing = false;

    const isSeller = ROLE_CAN_SELL.includes(user.role);

    root.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">My Profile</h1>
        <p class="page-subtitle">Your account and business information</p>
      </div>

      <div style="max-width:520px">

        <!-- Avatar + Role -->
        <div class="card mb-md" style="text-align:center;padding:var(--space-xl)">
          <div style="width:72px;height:72px;border-radius:50%;background:var(--color-accent-glow);border:3px solid var(--color-accent);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:1.8rem;font-weight:800;color:var(--color-accent);margin:0 auto var(--space-md)">
            ${user.businessName.charAt(0).toUpperCase()}
          </div>
          <h2 style="font-family:var(--font-display);font-size:1.2rem;font-weight:700">${user.businessName}</h2>
          <p class="text-muted text-sm">${user.email}</p>
          <span class="badge badge-${user.role}" style="margin-top:8px">${Formatters.formatRole(user.role)}</span>
        </div>

        <!-- Info Card -->
        <div class="card mb-md" id="profile-info">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-md)">
            <h3 class="card-title">Business Details</h3>
            <button class="btn btn-secondary btn-sm" onclick="ProfileView._toggleEdit()">Edit</button>
          </div>
          <div style="display:flex;flex-direction:column;gap:14px">
            ${_infoRow('Business Name', user.businessName)}
            ${_infoRow('Phone', user.phone)}
            ${_infoRow('District', user.district)}
            ${isSeller ? _infoRow('TIN Number', user.tinNumber) : ''}
            ${isSeller ? _infoRow('SDC Device ID', user.sdcId) : ''}
            ${_infoRow('Member Since', Formatters.formatDate(user.createdAt))}
          </div>
        </div>

        <!-- Edit Form (hidden by default) -->
        <div class="card mb-md hidden" id="profile-edit-form">
          <h3 class="card-title mb-md">Edit Profile</h3>
          <div class="form-group">
            <label class="form-label">Business Name</label>
            <input id="edit-name" type="text" class="form-input" value="${user.businessName}" />
          </div>
          <div class="form-group">
            <label class="form-label">Phone Number</label>
            <input id="edit-phone" type="tel" class="form-input" value="${user.phone}" />
          </div>
          <div class="form-group">
            <label class="form-label">District</label>
            <select id="edit-district" class="form-select">
              ${_districtOptions(user.district)}
            </select>
          </div>
          <div style="display:flex;gap:12px;margin-top:var(--space-md)">
            <button id="save-profile-btn" class="btn btn-primary" style="flex:1" onclick="ProfileView._save()">Save Changes</button>
            <button class="btn btn-secondary" onclick="ProfileView._toggleEdit()">Cancel</button>
          </div>
        </div>

        <!-- Account Actions -->
        <div class="card">
          <h3 class="card-title mb-md">Account</h3>
          <button class="btn btn-secondary btn-block mb-md"
            onclick="ProfileView._changePassword()">
            Change Password
          </button>
          <button class="btn btn-danger btn-block" onclick="Sidebar._handleLogout()">
            Sign Out
          </button>
        </div>

      </div>
    `;
  };

  const _toggleEdit = () => {
    _editing = !_editing;
    document.getElementById('profile-info').classList.toggle('hidden', _editing);
    document.getElementById('profile-edit-form').classList.toggle('hidden', !_editing);
  };

  const _save = async () => {
    const businessName = document.getElementById('edit-name')?.value.trim();
    const phone        = document.getElementById('edit-phone')?.value.trim();
    const district     = document.getElementById('edit-district')?.value;

    if (!businessName) { Toast.error('Business name is required.'); return; }
    if (!phone)        { Toast.error('Phone number is required.'); return; }
    if (!district)     { Toast.error('Please select a district.'); return; }

    Loader.button('save-profile-btn', true, 'Save Changes', 'Saving...');
    const res = await UserService.updateProfile(window.currentUser.uid, { businessName, phone, district });
    Loader.button('save-profile-btn', false, 'Save Changes');

    if (res.success) {
      // Update global user object
      window.currentUser.businessName = businessName;
      window.currentUser.phone        = phone;
      window.currentUser.district     = district;
      Toast.success('Profile updated successfully.');
      render(window.currentUser, document.getElementById('app-root'));
    } else {
      Toast.error(res.error);
    }
  };

  const _changePassword = () => {
    Modal.show({
      title:       'Change Password',
      confirmText: 'Send Reset Link',
      body: `
        <p class="mb-md">We will send a password reset link to:</p>
        <p style="font-weight:600;color:var(--color-accent)">${window.currentUser.email}</p>
      `,
      onConfirm: async () => {
        const res = await AuthService.sendPasswordReset(window.currentUser.email);
        if (res.success) Toast.success(res.message);
        else Toast.error(res.error);
      },
    });
  };

  const _infoRow = (label, value) => `
    <div style="display:flex;justify-content:space-between;align-items:center">
      <span class="text-muted text-sm">${label}</span>
      <span style="font-weight:500;text-align:right;max-width:60%">${value || '—'}</span>
    </div>
  `;

  const DISTRICTS = [
    'Bugesera','Burera','Gakenke','Gasabo','Gatsibo','Gicumbi','Gisagara',
    'Huye','Kamonyi','Karongi','Kayonza','Kicukiro','Kirehe','Muhanga',
    'Musanze','Ngoma','Ngororero','Nyabihu','Nyagatare','Nyamagabe',
    'Nyamasheke','Nyanza','Nyarugenge','Nyaruguru','Rubavu','Ruhango',
    'Rulindo','Rusizi','Rutsiro','Rwamagana',
  ];

  const _districtOptions = (selected) =>
    DISTRICTS.map(d => `<option value="${d}" ${d === selected ? 'selected' : ''}>${d}</option>`).join('');

  return { render, _toggleEdit, _save, _changePassword };

})();
