import { imgUrl } from '../api';
// Round profile picture, or the first letter of the name if there is no photo
export default function Avatar({ user, size = 34 }) {
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size / 2.2 }}>
      {user.avatar ? <img src={imgUrl(user.avatar)} alt="" /> : (user.name || '?')[0]}
    </div>
  );
}
