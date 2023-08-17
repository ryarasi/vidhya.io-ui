import { Action, Selector, State, StateContext, Store } from '@ngxs/store';
import {
  defaultGroupState,
  emptyGroupFormRecord,
  GroupStateModel,
} from './group.model';

import { Injectable, OnDestroy } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Router } from '@angular/router';
import {
  FetchParams,
  Group,
  MatSelectOption,
  startingFetchParams,
  SUBSCRIPTION_METHODS,
} from 'src/app/shared/common/models';
import {
  CreateUpdateGroupAction,
  DeleteGroupAction,
  FetchGroupsAction,
  FetchNextGroupsAction,
  ForceRefetchGroupsAction,
  GetGroupAction,
  GroupSubscriptionAction,
  ResetGroupFormAction,
} from './group.actions';
import { SearchParams } from 'src/app/shared/modules/master-grid/table.model';
import {
  convertPaginatedListToNormalList,
  getErrorMessageFromGraphQLResponse,
  paginatedSubscriptionUpdater,
  updateFetchParams,
} from 'src/app/shared/common/functions';
import { ToggleLoadingScreen } from 'src/app/shared/state/loading/loading.actions';
import { GROUP_QUERIES } from 'src/app/shared/api/graphql/queries.graphql';
import { ShowNotificationAction } from 'src/app/shared/state/notifications/notification.actions';
import { SUBSCRIPTIONS } from 'src/app/shared/api/graphql/subscriptions.graphql';
import { GROUP_MUTATIONS } from 'src/app/shared/api/graphql/mutations.graphql';
import { GROUPS } from '../../../dashboard.component';
import { uiroutes } from 'src/app/shared/common/ui-routes';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@State<GroupStateModel>({
  name: 'groupState',
  defaults: defaultGroupState,
})
@Injectable()
export class GroupState implements OnDestroy{
  destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private apollo: Apollo,
    private store: Store,
    private router: Router
  ) {}

  @Selector()
  static listGroups(state: GroupStateModel): Group[] {
    return state.groups;
  }

  @Selector()
  static isFetching(state: GroupStateModel): boolean {
    return state.isFetching;
  }

  @Selector()
  static fetchParams(state: GroupStateModel): FetchParams {
    return state.fetchParamObjects[state.fetchParamObjects.length - 1];
  }
  @Selector()
  static listGroupOptions(state: GroupStateModel): MatSelectOption[] {
    const options: MatSelectOption[] = state.groups.map((i) => {
      const option: MatSelectOption = {
        value: i.id,
        label: i.name,
      };
      return option;
    });

    return options;
  }

  @Selector()
  static errorFetching(state: GroupStateModel): boolean {
    return state.errorFetching;
  }

  @Selector()
  static formSubmitting(state: GroupStateModel): boolean {
    return state.formSubmitting;
  }

  @Selector()
  static errorSubmitting(state: GroupStateModel): boolean {
    return state.errorSubmitting;
  }

  @Selector()
  static getGroupFormRecord(state: GroupStateModel): Group {
    return state.groupFormRecord;
  }

  @Action(ForceRefetchGroupsAction)
  forceRefetchGroups({ getState, patchState }: StateContext<GroupStateModel>) {
    const state = getState();
    let previousFetchParams =
      state.fetchParamObjects[state.fetchParamObjects.length - 1];
    previousFetchParams = previousFetchParams
      ? previousFetchParams
      : startingFetchParams;
    const pageNumber = previousFetchParams?.currentPage;
    const previousSearchParams: SearchParams = {
      pageNumber,
      pageSize: previousFetchParams?.pageSize,
      searchQuery: previousFetchParams?.searchQuery,
      columnFilters: previousFetchParams?.columnFilters,
    };
    patchState({ fetchPolicy: 'network-only' });
    this.store.dispatch(
      new FetchGroupsAction({ searchParams: previousSearchParams })
    );
  }

  @Action(FetchNextGroupsAction)
  fetchNextGroups({ getState }: StateContext<GroupStateModel>) {
    const state = getState();
    const lastPageNumber = state.lastPage;
    let previousFetchParams =
      state.fetchParamObjects[state.fetchParamObjects.length - 1];
    previousFetchParams = previousFetchParams
      ? previousFetchParams
      : startingFetchParams;
    const pageNumber = previousFetchParams.currentPage + 1;
    const newSearchParams: SearchParams = {
      pageNumber,
      pageSize: previousFetchParams.pageSize,
      searchQuery: previousFetchParams.searchQuery,
      columnFilters: previousFetchParams.columnFilters,
    };
    if (
      !lastPageNumber ||
      (lastPageNumber != null && pageNumber <= lastPageNumber)
    ) {
      this.store.dispatch(
        new FetchGroupsAction({ searchParams: newSearchParams })
      );
    }
  }
  @Action(FetchGroupsAction)
  fetchGroups(
    { getState, patchState }: StateContext<GroupStateModel>,
    { payload }: FetchGroupsAction
  ) {
    let { searchParams } = payload;
    const state = getState();
    const { fetchPolicy, fetchParamObjects } = state;
    const { searchQuery, pageSize, pageNumber, columnFilters } = searchParams;
    let newFetchParams = updateFetchParams({
      fetchParamObjects,
      newPageNumber: pageNumber,
      newPageSize: pageSize,
      newSearchQuery: searchQuery,
      newColumnFilters: columnFilters,
    });
    const variables = {
      searchField: searchQuery,
      limit: newFetchParams.pageSize,
      offset: newFetchParams.offset,
    };
    patchState({ isFetching: true });
    this.store.dispatch(
      new ToggleLoadingScreen({
        message: 'Fetching groups...',
        showLoadingScreen: true,
      })
    );
    this.apollo
      .query({
        query: GROUP_QUERIES.GET_GROUPS,
        variables,
        // fetchPolicy,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        ({ data }: any) => {
          this.store.dispatch(
            new ToggleLoadingScreen({
              showLoadingScreen: false,
            })
          );
          const response = data.groups;
          newFetchParams = { ...newFetchParams };
          let paginatedGroups = state.paginatedGroups;
          paginatedGroups = {
            ...paginatedGroups,
            [pageNumber]: response,
          };

          let groups = convertPaginatedListToNormalList(paginatedGroups);
          let lastPage = null;
          if (response.length < newFetchParams.pageSize) {
            lastPage = newFetchParams.currentPage;
          }
          patchState({
            groups,
            paginatedGroups,
            lastPage,
            fetchParamObjects: state.fetchParamObjects.concat([newFetchParams]),
            isFetching: false,
          });
        },
        (error) => {
          this.store.dispatch(
            new ShowNotificationAction({
              message: getErrorMessageFromGraphQLResponse(error),
              action: 'error',
            })
          );
          patchState({ isFetching: false });
        }
      );
  }

  @Action(GroupSubscriptionAction)
  subscribeToGroups({ getState, patchState }: StateContext<GroupStateModel>) {
    const state = getState();
    if (!state.groupsSubscribed) {
      this.apollo
        .subscribe({
          query: SUBSCRIPTIONS.group,
        })
        .pipe(takeUntil(this.destroy$))
        .subscribe((result: any) => {
          const state = getState();
          const method = result?.data?.notifyGroup?.method;
          const group = result?.data?.notifyGroup?.group;
          const { newPaginatedItems, newItemsList } =
            paginatedSubscriptionUpdater({
              paginatedItems: state.paginatedGroups,
              method,
              modifiedItem: group,
            });
          patchState({
            groups: newItemsList,
            paginatedGroups: newPaginatedItems,
            groupsSubscribed: true,
          });
        });
    }
  }

  @Action(GetGroupAction)
  getGroup(
    { patchState }: StateContext<GroupStateModel>,
    { payload }: GetGroupAction
  ) {
    const { id } = payload;

    patchState({ isFetching: true });
    this.apollo
      .query({
        query: GROUP_QUERIES.GET_GROUP,
        variables: { id },
        fetchPolicy: 'network-only',
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        ({ data }: any) => {
          const response = data.group;
          patchState({ groupFormRecord: response, isFetching: false });
        },
        (error) => {
          this.store.dispatch(
            new ShowNotificationAction({
              message: getErrorMessageFromGraphQLResponse(error),
              action: 'error',
            })
          );
          patchState({ isFetching: false });
        }
      );
  }

  @Action(CreateUpdateGroupAction)
  createUpdateGroup(
    { getState, patchState }: StateContext<GroupStateModel>,
    { payload }: CreateUpdateGroupAction
  ) {
    const state = getState();
    const { form, formDirective } = payload;
    let { formSubmitting } = state;
    if (form.valid) {
      formSubmitting = true;
      patchState({ formSubmitting });
      const values = form.value;

      const updateForm = values.id == null ? false : true;
      const { id, ...sanitizedValues } = values;
      const variables = updateForm
        ? {
            input: sanitizedValues,
            id: values.id, // adding id to the mutation variables if it is an update mutation
          }
        : { input: sanitizedValues };

      this.apollo
        .mutate({
          mutation: updateForm
            ? GROUP_MUTATIONS.UPDATE_GROUP
            : GROUP_MUTATIONS.CREATE_GROUP,
          variables,
        })
        .pipe(takeUntil(this.destroy$))
        .subscribe(
          ({ data }: any) => {
            const response = updateForm ? data.updateGroup : data.createGroup;
            patchState({ formSubmitting: false });

            if (response.ok) {
              const method = updateForm
                ? SUBSCRIPTION_METHODS.UPDATE_METHOD
                : SUBSCRIPTION_METHODS.CREATE_METHOD;
              const group = response.group;
              const { newPaginatedItems, newItemsList } =
                paginatedSubscriptionUpdater({
                  paginatedItems: state.paginatedGroups,
                  method,
                  modifiedItem: group,
                });

              form.reset();
              formDirective.resetForm();
              this.router.navigate([uiroutes.DASHBOARD_ROUTE.route], {
                queryParams: {
                  tab: GROUPS,
                },
              });
              patchState({
                paginatedGroups: newPaginatedItems,
                groups: newItemsList,

                groupFormRecord: emptyGroupFormRecord,
                fetchPolicy: 'network-only',
              });
              this.store.dispatch(
                new ShowNotificationAction({
                  message: `Group ${
                    updateForm ? 'updated' : 'created'
                  } successfully!`,
                  action: 'success',
                })
              );
            } else {
              this.store.dispatch(
                new ShowNotificationAction({
                  message: getErrorMessageFromGraphQLResponse(response?.errors),
                  action: 'error',
                })
              );
            }
          },
          (error) => {
            this.store.dispatch(
              new ShowNotificationAction({
                message: getErrorMessageFromGraphQLResponse(error),
                action: 'error',
              })
            );
            patchState({ formSubmitting: false });
          }
        );
    } else {
      this.store.dispatch(
        new ShowNotificationAction({
          message:
            'Please make sure there are no errors in the form before attempting to submit!',
          action: 'error',
        })
      );
    }
  }

  @Action(DeleteGroupAction)
  deleteGroup(
    { getState, patchState }: StateContext<GroupStateModel>,
    { payload }: DeleteGroupAction
  ) {
    let { id } = payload;
    this.apollo
      .mutate({
        mutation: GROUP_MUTATIONS.DELETE_GROUP,
        variables: { id },
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        ({ data }: any) => {
          const response = data.deleteGroup;

          if (response.ok) {
            this.router.navigate([uiroutes.DASHBOARD_ROUTE.route], {
              queryParams: {
                tab: GROUPS,
              },
            });
            const method = SUBSCRIPTION_METHODS.DELETE_METHOD;
            const group = response.group;
            const state = getState();
            const { newPaginatedItems, newItemsList } =
              paginatedSubscriptionUpdater({
                paginatedItems: state.paginatedGroups,
                method,
                modifiedItem: group,
              });
            patchState({
              paginatedGroups: newPaginatedItems,
              groups: newItemsList,
              groupFormRecord: emptyGroupFormRecord,
            });
            this.store.dispatch(
              new ShowNotificationAction({
                message: 'Group deleted successfully!',
                action: 'success',
              })
            );
          } else {
            this.store.dispatch(
              new ShowNotificationAction({
                message: getErrorMessageFromGraphQLResponse(response?.errors),
                action: 'error',
              })
            );
          }
        },
        (error) => {
          this.store.dispatch(
            new ShowNotificationAction({
              message: getErrorMessageFromGraphQLResponse(error),
              action: 'error',
            })
          );
        }
      );
  }

  @Action(ResetGroupFormAction)
  resetGroupForm({ patchState }: StateContext<GroupStateModel>) {
    patchState({
      groupFormRecord: emptyGroupFormRecord,
      formSubmitting: false,
    });
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
