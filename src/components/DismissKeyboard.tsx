import React from 'react';
import { TouchableWithoutFeedback, Keyboard, View, ViewStyle } from 'react-native';

interface Props {
    children: React.ReactNode;
    style?: ViewStyle;
}

/**
 * Wrapper component that dismisses the keyboard when touching outside of inputs.
 * Vital for iPhone users where a "done" button might be missing.
 */
export default function DismissKeyboard({ children, style }: Props) {
    return (
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()} accessible={false}>
            <View style={style}>
                {children}
            </View>
        </TouchableWithoutFeedback>
    );
}
