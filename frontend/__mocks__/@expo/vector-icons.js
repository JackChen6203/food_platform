// Mock for @expo/vector-icons
import * as React from 'react';
import { View } from 'react-native';

export const Ionicons = (props) => <View {...props} />;
export const MaterialIcons = (props) => <View {...props} />;
export const FontAwesome = (props) => <View {...props} />;

export default { Ionicons, MaterialIcons, FontAwesome };
