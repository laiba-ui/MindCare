// app/utils/responsive.ts
import { Dimensions, Platform } from 'react-native';

const { width: rawWidth, height: rawHeight } = Dimensions.get('window');

// ✅ On web, browser window can be 1400px+ which makes wp() values huge.
//    Cap to max 430 (iPhone Pro Max width) so all sizing stays mobile-appropriate.
//    On native iOS/Android this has no effect since screens are already ≤430px.
const MAX_MOBILE_WIDTH  = 430;
const MAX_MOBILE_HEIGHT = 932;

export const SCREEN_WIDTH  = Platform.OS === 'web' ? Math.min(rawWidth,  MAX_MOBILE_WIDTH)  : rawWidth;
export const SCREEN_HEIGHT = Platform.OS === 'web' ? Math.min(rawHeight, MAX_MOBILE_HEIGHT) : rawHeight;

export const wp = (percent: number) => (SCREEN_WIDTH  * percent) / 100;
export const hp = (percent: number) => (SCREEN_HEIGHT * percent) / 100;