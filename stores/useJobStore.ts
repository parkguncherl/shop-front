import { create, StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ApiResponse, JobRequestUpdate } from '../generated';
import { AxiosPromise } from 'axios';
import { authApi } from '../libs';

interface JobState {}

interface JobApiState {
  updateJob: (jobRequestUpdate: JobRequestUpdate) => AxiosPromise<ApiResponse>;
}

type JobInJobStore = JobState & JobApiState;

/**
 * 전역 상태에 의도치 않은 데이터가 혼입되지 않도록 set 메서드 호출 이전 대응할 것
 * */
const initialStateCreator: StateCreator<JobInJobStore, any> = (set, get, api) => {
  return {
    updateJob: (jobRequestUpdate) => {
      return authApi.patch('/job/boryuUpdate', jobRequestUpdate);
    },
  };
};

export const useJobStore = create<JobInJobStore>()(devtools(immer(initialStateCreator)));
