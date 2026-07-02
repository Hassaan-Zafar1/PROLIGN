const Avatar = ({ src, name, size = 'md', className = '' }) => {
  const sizes = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-14 h-14', xl: 'w-20 h-20' };
  // Use brand earthy green as fallback avatar background
  const fallbackSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=4a5a2a&color=ffffff&size=128&bold=true`;
  return (
    <img
      src={src || fallbackSrc}
      alt={name ? `${name}'s avatar` : 'User avatar'}
      className={`${sizes[size] || sizes.md} rounded-full object-cover ring-2 ring-surface-variant ${className}`}
    />
  );
};

export default Avatar;
