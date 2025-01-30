export interface ErrorObjectType {
    file_name: string;
    display_name: string;
    rule_id: string;
    message: string;
    line_num: number;
    col_num: number;
    length: number
}