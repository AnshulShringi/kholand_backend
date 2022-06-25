import { uniqueNamesGenerator, adjectives, animals, Config } from "unique-names-generator";

export function generateRandomNickName(): string {
    const customConfig: Config = {
        dictionaries: [adjectives, animals],
        separator: '',
        style: 'capital'
    };
    const randomName = uniqueNamesGenerator(customConfig);

    return randomName
}