import ProfileSettings from '../components/ProfileSettings';

const Settings = ({ navigateTo }) => <ProfileSettings onAccountClosed={() => navigateTo?.('home')} />;

export default Settings;
