export declare type TOptions = {
    showMessageClassOnParent: string | boolean;
    messageParentClass: string | boolean;
    controlErrorClass: string;
    controlValidClass: string;
    messageErrorClass: string;
    enableHiddenMessageClass: string;
    disableLiveValidationClass: string;
    disableShowValidClass: string;
    messageTag: string;
    messageIdPostfix: string;
    messageErrorPrefix: string;
    showAllErrors: boolean;
    showValid: boolean;
    wait: boolean;
    focusScreenOffsetY: number | boolean;
};
declare const defaultOptions: TOptions;
export default defaultOptions;
