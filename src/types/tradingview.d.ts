declare module 'charting_library' {
  export interface ChartingLibraryWidgetOptions {
    symbol: string;
    interval: string;
    container: string;
    library_path: string;
    locale: string;
    charts_storage_url: string;
    charts_storage_api_version: string;
    client_id: string;
    user_id: string;
    fullscreen: boolean;
    autosize: boolean;
    studies_overrides: object;
    theme?: string;
  }

  export class widget {
    constructor(options: ChartingLibraryWidgetOptions);
    onChartReady(callback: () => void): void;
    chart(): any;
    remove(): void;
  }
} 