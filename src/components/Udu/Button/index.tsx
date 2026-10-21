import { type UDUButton } from "./types.tsx";
import { styles } from "../styles.tsx";
import { Text, TouchableOpacity, View } from "react-native";

function UDUButton(props: UDUButton) {
    const { title, onPress } = props;
    return (
        <View>
            <TouchableOpacity
                style={styles.button}
                onPress={onPress}
            >
                <Text>{title}</Text>
            </TouchableOpacity>
        </View>
    )
}

export default UDUButton