import DataLoader from "dataloader";
import { Updoot } from "../entities/Updoot";
import { User } from "../entities/User";

// batches all the user id's to single function call(single SQL statement)
// 해당 function call에서 모은 key 값을 기반으로 한 번에 질의
// 질의가 끝나면 매칭된 키를 통해 값을 return(Promise 형태인 이유)

export interface UpdootArgument {
  userId: number;
  postId: number;
}

// 요청이 들어올 때마다 수행한다.
// keys = [1, 78, 8, 9]
// Array of user.id
// values [{id: 1}, {id : 78, username:'tim'}, {id : 8}, {id : 9}]
export const createUserLoader = () =>
  new DataLoader<number, User>(async (userIds) => {
    // fetch user with those Ids;
    // userIds가 readonly라서 type casting
    const users = await User.findByIds(userIds as number[]);
    console.log("userLoaderIds : ", userIds);
    // 특정 형태로 mapping
    const userIdToUser: Record<number, User> = {};
    users.forEach((user) => {
      userIdToUser[user.id] = user;
    });
    // 순서대로 매칭해야 한다!!!!
    // 질의 결과가 처음에 들어온 id 순서대로 정렬되어 있지 않을 가능성 높다.
    return userIds.map((id) => userIdToUser[id]);
  });
// key [{userId:10, postId:20}, {userId:22, postId:30}]
// value [undefined, {userId:22, postId,30, value:-1}]

export const createUpdootLoader = () =>
  new DataLoader<UpdootArgument, Updoot | null>(
    // 핵심 : 들어온 key 값에 순서대로 매칭
    async (keys) => {
      const updoots = (await Updoot.find({ where: keys })) as Updoot[];
      // where 조건을 배열 형태로 넣을 수 있다. SQL의  OR와 같은 개념
      // 정렬해보자!
      const mappedUpdoots: Record<string, Updoot> = {};
      updoots.forEach((updoot) => {
        mappedUpdoots[`${updoot.userId}:${updoot.postId}`] = updoot;
      });

      // arg의 순서대로 값 매칭
      return keys.map(
        (updoot) => mappedUpdoots[`${updoot.userId}:${updoot.postId}`]
      );
    }
  );
