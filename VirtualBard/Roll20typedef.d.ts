interface Roll20Object {
    /** Readonly. Cannot be assiged at object instantiation */
    id?: string;
    /** Readonly. Cannot be assiged at object instantiation */
    type?: string;
}
interface Character extends Roll20Object {
    /** the name of the character as it will appear in the "Name" field */
    name : string;
    /** Comma delimited list of players that this character sheet can be viewed by. Use the string "all" to make it available for all */
    inplayerjournals : string;
    controlledby : string;
}
interface Attribute extends Roll20Object {
    name: string;
    current: any; 
    characterid:string;
}
interface ChatOptions {
    noarchive: boolean;
    use3d: boolean;
}
interface MessageCallback {
    (ops: string): void;
}
declare function sendChat(sendas: string, message: string, callback: MessageCallback, options: ChatOptions) : void;
/**
 * Creates a new Roll20 object. 
 * Source: https://wiki.roll20.net/API:Objects#Creating_Objects
 * @param {string} type - The Type of Roll20 object to create. For consistency, this definition file has implemented the class names to be the same name as what you need to provide here.
 * @param {Roll20Object} attributes - The properties the new Roll20 object will be created with.
 *
 */
declare function createObj<T extends Roll20Object>(type: string, attributes: T) : T;



