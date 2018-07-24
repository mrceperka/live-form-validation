import { TOptions } from './options';
declare global {
    interface Window {
        ContributteLiveFormOptions: TOptions | undefined;
    }
}
declare var LiveForm: any;
export default LiveForm;
