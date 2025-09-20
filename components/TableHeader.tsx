import React, { RefObject, useRef, useState } from 'react';
import { Utils } from '../libs/utils';
import DropDownAtom from './atom/DropDownAtom';
import { PageObject } from '../generated';
import { Input, InputRef } from 'antd';
import { AgGridReact } from 'ag-grid-react';
import { CellClassParams, IRowNode } from 'ag-grid-community';
import { toastInfo } from './ToastMessage';

interface Props {
  count: number;
  viewCount?: number;
  isCount?: boolean;
  isChoice?: boolean;
  choiceCount?: number;
  children?: React.ReactNode;
  description?: string;
  title?: string;
  paging?: PageObject;
  setPaging?: (pagingInfo: PageObject | undefined) => void | undefined;
  search?: () => void;
  gridRef?: RefObject<AgGridReact>;
  isPaging?: boolean;
}

export const TableHeader = ({
  count,
  isCount = true,
  viewCount,
  isChoice = false,
  choiceCount,
  children,
  description,
  title,
  paging,
  setPaging,
  search,
  gridRef,
  isPaging = true,
}: Props) => {
  let colPosition = -1;
  let rowPosition = -1;
  const [searchText, setSearchText] = useState<string>('');
  //const [searchedRowNum, setSearchedRowNum] = useState<number>(-1);
  //const [searchedColumnNum, setSearchedColumnNum] = useState<number>(0);
  const inputRef = useRef<InputRef>(null);

  return (
    <div className="gridBoxInfo">
      <div className="left">
        <ul>
          {!viewCount && paging?.pageRowCount !== undefined && isPaging && (
            <li>
              <DropDownAtom
                name="customPageRowCount"
                options={[
                  { key: '20', value: '20', label: '20 건' },
                  { key: '50', value: '50', label: '50 건' },
                  { key: '100', value: '100', label: '100 건' },
                  { key: '500', value: '500', label: '500 건' },
                  { key: '1000', value: '1000', label: '1,000 건' },
                  { key: '10000', value: '10000', label: '10,000 건' },
                  { key: '999999', value: '999999', label: 'MAX' },
                ]}
                defaultValue={paging?.pageRowCount ? String(paging?.pageRowCount) : '20'}
                onChangeOptions={(name, value) => {
                  if (setPaging && paging) {
                    setPaging({ ...paging, curPage: paging.curPage, pageRowCount: Number(value) });
                    if (search) {
                      setTimeout(() => {
                        search();
                      }, 10);
                    }
                  }
                }}
              />
            </li>
          )}
          <li className="total">
            {isCount && (
              <strong>
                검색
                {viewCount && (
                  <span>
                    {Utils.setComma(viewCount)} {'/'}
                  </span>
                )}
                <span>
                  {Utils.setComma(count)} {'건'}
                </span>
                {isChoice && (
                  <span>
                    {'선택'} {choiceCount} {'건'}
                  </span>
                )}
              </strong>
            )}
            {description && (
              <div>
                <span className={'req'}>{description}</span>
              </div>
            )}
          </li>
          {gridRef && (
            <li className={`gridFindDiv ${searchText?.length > 0 ? 'focus' : ''}`}>
              <span>{title ?? '검색'}</span>
              <Input
                ref={inputRef}
                style={{ width: 225 }} // 글자크기 16자까지 들어가게 대표님 요청
                placeholder={'표 내 검색'}
                type={'text'}
                name={'searchText'}
                onChange={(e) => {
                  if (searchText !== e.target.value) {
                    rowPosition = -1;
                    colPosition = 0;
                    setSearchText(e.target.value);
                  }
                }}
                value={searchText}
                onKeyDown={(e: React.KeyboardEvent) => {
                  const gridApi = gridRef.current?.api;
                  if (gridApi && e.key === 'Enter') {
                    const allColumns = gridApi.getAllDisplayedColumns();
                    const maxLength = gridApi.getDisplayedRowCount();
                    const nodeList: IRowNode[] = [];
                    gridApi.forEachNode((node) => nodeList.push(node));
                    for (const column of allColumns) {
                      const colDef = column.getColDef();
                      Object.assign(colDef, {
                        cellClassRules: {
                          ['searchCell']: (params: CellClassParams) => {
                            const field = column.getColDef().field;
                            const paramData = field ? params.data[field] : null;
                            const fieldString = paramData ? String(paramData) : null;
                            return fieldString && fieldString.indexOf(searchText) > -1;
                          },
                        },
                      });
                    }
                    gridApi.refreshCells({ force: true });
                    //gridApi.refreshHeader();

                    for (const node of nodeList) {
                      // ★★★
                      let colIndex = -1;
                      const rowIndex = node.rowIndex ? node.rowIndex : 0;
                      if (allColumns && rowIndex >= rowPosition) {
                        for (const colName of allColumns) {
                          // ★★★
                          colIndex++;
                          const field = colName.getColDef().field?.toString();
                          const fieldString = String(node.data[colName.getColDef().field || '']);
                          const isContain = fieldString.indexOf(searchText) > -1;
                          if (isContain && rowIndex >= rowPosition && colIndex >= colPosition) {
                            //alert('[' + colPosition + '] colIndex:' + colIndex + '============== [' + colPosition + ']rowIndex:' + rowIndex);
                            if (rowPosition !== rowIndex || colPosition !== colIndex) {
                              //alert('===[' + colPosition + '] colIndex:' + colIndex + '============== [' + colPosition + ']rowIndex:' + rowIndex);
                              // 이전선택건이 아니면
                              rowPosition = rowIndex;
                              colPosition = colIndex;
                              gridApi.setFocusedCell(rowIndex, field || '');
                              gridApi.ensureNodeVisible(node);
                              inputRef.current?.focus();
                              return;
                            }
                          }
                        }
                        colPosition = -1; // row 가 증가하게 될때 col 은 처음부터 다시 찾아야 하기에 초기화
                        if (maxLength === rowIndex + 1) {
                          if (rowPosition > 0 || colPosition > 0) {
                            toastInfo('더 이상 일치하는 데이터가 없습니다.');
                          } else {
                            toastInfo('일치하는 데이터가 없습니다.');
                          }
                          rowPosition = 0;
                          inputRef.current?.focus();
                        }
                      }
                    }
                  }
                }}
              />
            </li>
          )}
        </ul>
      </div>
      <div className={'right'}>{children}</div>
    </div>
  );
};
