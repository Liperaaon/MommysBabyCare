const Colors = {
  primary: '#FFB7C5',
  secondary: '#BAE1FF',
  background: '#FFFDF7',
  accent: '#C5A065',
  text: '#2F2F2F',
  success: '#25D366',
};

export default {
  light: {
    text: Colors.text,
    background: Colors.background,
    tint: Colors.primary,
    tabIconDefault: '#ccc',
    tabIconSelected: Colors.primary,
  },
  dark: {
    text: Colors.text,
    background: Colors.background,
    tint: Colors.primary,
    tabIconDefault: '#ccc',
    tabIconSelected: Colors.primary,
  },
  ...Colors,
};
