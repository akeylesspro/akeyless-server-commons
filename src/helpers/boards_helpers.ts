import { Board, Car, TObject } from "akeyless-types-commons";
import { cache_manager } from "../managers";

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

export type BoardMakerResult = "erm" | "jimi" | "ruptela" | "servision" | "jimi_iothub";

export const get_board_maker_by_board_type = (type: string): BoardMakerResult => {
    const settings = cache_manager.getObjectData("settings");
    if (settings.erm_board_types.values.includes(type)) {
        return "erm";
    }
    if (settings.jimi_board_types.values.includes(type)) {
        return "jimi";
    }
    if (settings.jimi_iothub_board_types.values.includes(type)) {
        return "jimi_iothub";
    }
    if (settings.ruptela_board_types.values.includes(type)) {
        return "ruptela";
    }
    if (settings.servision_board_types.values.includes(type)) {
        return "servision";
    }
    throw new Error("failed to get board maker from DB, type: " + type);
};

export const get_board_maker_by_car = (car: Car): BoardMakerResult => {
    const imei = car.peripherals?.[0]?.mac;
    if (!imei) {
        throw new Error("IMEI not found for car number: " + car.carId);
    }
    const boards = cache_manager.getArrayData("boards");
    if (!boards.length) {
        throw new Error("Boards are not in cache");
    }
    const board: Board = boards.find((board) => board.imei === imei);
    if (!board) {
        throw new Error("Board not found for imei: " + imei);
    }

    const settings = cache_manager.getObjectData("settings");
    if (settings.erm_board_types.values.includes(board.type)) {
        return "erm";
    }
    if (settings.jimi_board_types.values.includes(board.type)) {
        return "jimi";
    }
    if (settings.jimi_iothub_board_types.values.includes(board.type)) {
        return "jimi_iothub";
    }
    if (settings.ruptela_board_types.values.includes(board.type)) {
        return "ruptela";
    }
    if (settings.servision_board_types.values.includes(board.type)) {
        return "servision";
    }
    throw new Error("failed to get board maker for board type: " + board.type);
};
