import { ReactNode } from "react";
export declare function TemplateEditor(props: {
    type?: string;
    title?: string;
    monacoEditor?: React.ReactNode;
    controlData: any[];
    template: any;
    portals?: any[];
    createControl?: {
        createResource: (query: string) => void;
        cancelCreate: () => void;
        pauseCreate: () => void;
        creationStatus?: string;
        creationMsg?: string;
    };
    i18n?: (key: string) => string;
}): JSX.Element;
