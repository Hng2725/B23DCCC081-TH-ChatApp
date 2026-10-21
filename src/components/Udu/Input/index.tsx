import { type UDUInput } from "./types.tsx";
import { styles } from "../styles.tsx";
import { Text, TextInput, View } from "react-native";

function UDUInput(props: UDUInput) {
    const { placeholder, onChangeText, value, keyboardType } = props;
    return (
        <View>
            <TextInput
                style={styles.input}
                placeholder={placeholder}
                keyboardType={keyboardType}
                onChangeText={onChangeText}
                value={value}
            />
        </View>
    )
}

export default UDUInput