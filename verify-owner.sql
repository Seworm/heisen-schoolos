SELECT
  u.id,
  u.email,
  u.platform_role,
  sm.id AS membership_id,
  sm.school_id,
  sm.role AS membership_role
FROM users u
LEFT JOIN school_memberships sm
  ON sm.user_id = u.id
WHERE u.email = 'atsu.seworm@gmail.com';
