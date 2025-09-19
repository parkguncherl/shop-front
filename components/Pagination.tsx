import { PageObject } from '../generated';
import Link from 'next/link';
interface Props {
  pageObject: PageObject;
  setPaging: (pagingInfo: PageObject | undefined) => void;
}

export const Pagination = ({ pageObject, setPaging }: Props): JSX.Element => {
  return (
    <div className="pagingBox">
      <ul>
        <li
          className="prev_all"
          onClick={() => {
            setPaging({ ...pageObject, curPage: 1 });
          }}
        >
          <Link href={''} title={'최신페이지로 이동'}></Link>
        </li>
        <li
          className="prev"
          onClick={() => {
            if ((pageObject.curPage || 1) <= 1) {
              return;
            }
            setPaging({ ...pageObject, curPage: (pageObject.curPage || 1) - 1 });
          }}
        >
          <Link href={''} title={'이전페이지로 이동'}></Link>
        </li>
        {(pageObject?.pageBlocks || [1]).map((n: number) => (
          <li
            className={`${pageObject.curPage === n ? 'on' : ''}`}
            key={n}
            onClick={() => {
              setPaging({ ...pageObject, curPage: n });
            }}
          >
            <Link href={''}>{n}</Link>
          </li>
        ))}
        <li
          className="next"
          onClick={() => {
            if ((pageObject.curPage || 1) >= (pageObject.totalPageCount || 1)) {
              return;
            }
            setPaging({ ...pageObject, curPage: (pageObject.curPage || 1) + 1 });
          }}
        >
          <Link href={''} title={'다음페이지로 이동'}></Link>
        </li>
        <li
          className="next_all"
          onClick={() => {
            setPaging({ ...pageObject, curPage: pageObject.totalPageCount || 1 });
          }}
        >
          <Link href={''} title={'마지막페이지로 이동'}></Link>
        </li>
      </ul>
    </div>
  );
};
