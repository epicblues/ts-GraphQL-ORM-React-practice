import DataLoader from "dataloader";
import { Updoot } from "../entities/Updoot";
import { User } from "../entities/User";

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
    return userIds.map((id) => userIdToUser[id]);
  });

export const createUpdootLoader = () =>
  new DataLoader<UpdootArgument, Updoot>(
    // 핵심 : 들어온 key 값에 순서대로 매칭
    async (arg) => {
      const updoots = (await Updoot.find({ where: arg })) as Updoot[];

      // 정렬해보자!
      return arg.map((args) => {
        return updoots.find(
          (updoot) =>
            updoot.userId === args.userId && updoot.postId === args.postId
        ) as Updoot;
      });
    }
  );
