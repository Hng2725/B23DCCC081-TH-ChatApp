export interface UDUInput {
    placeholder?: string;
    keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
    onChangeText: (text: string) => void;
    value: string;
    style?: 'default' | 'outline';
}