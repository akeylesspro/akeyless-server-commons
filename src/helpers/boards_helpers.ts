import { TObject } from "akeyless-types-commons";

interface BoardProviderWithBoardTypes {
    board_provider: "erm" | "jimi" | "ruptela" | "servision" | "jimi_iothub";
    board_types: string[];
}
export const extract_board_types_from_settings = (settings: TObject<any>): BoardProviderWithBoardTypes[] => {
    const { erm_board_types, jimi_board_types, jimi_iothub_board_types, ruptela_board_types, servision_board_types } = settings;
    const result: BoardProviderWithBoardTypes[] = [
        { board_provider: "erm", board_types: erm_board_types.values },
        { board_provider: "jimi", board_types: jimi_board_types.values },
        { board_provider: "ruptela", board_types: ruptela_board_types.values },
        { board_provider: "servision", board_types: servision_board_types.values },
        { board_provider: "jimi_iothub", board_types: jimi_iothub_board_types.values },
    ];
    return result;
};
