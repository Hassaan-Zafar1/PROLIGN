const Avatar = ({ src, name, size = 'md', className = '' }) => {
  const sizes = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-14 h-14', xl: 'w-20 h-20' };
  return (
    <img
      src={src || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=6750A4&color=fff&size=96`}
      alt={name || 'User'}
      className={`${sizes[size] || sizes.md} rounded-full object-cover ring-2 ring-surface-variant ${className}`}
    />
  );
};

export default Avatar;
