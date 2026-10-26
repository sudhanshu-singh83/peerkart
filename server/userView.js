// What the logged-in user is allowed to see about their own account (never the password hash).
module.exports = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role, status: u.status, phone: u.phone, branch: u.branch, semester: u.semester, bio: u.bio, avatar: u.avatar, createdAt: u.createdAt });
