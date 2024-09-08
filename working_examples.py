# example 1
import typing


class TestListCatalog:
    test_cross_db_column_pattern: str = "c%"
    test_table_types: typing.Tuple[str] = ( # test_table_types: typing.Tuple[str, ...] = ( 
        "TABLE",
        "SHARED TABLE",
        "VIEW",
        "EXTERNAL TABLE",
    )


