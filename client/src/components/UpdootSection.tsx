import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { Flex, IconButton } from '@chakra-ui/react';
import react, { useState } from 'react'
import { Post, PostSnippetFragment, PostsQuery, useVoteMutation } from '../generated/graphql';

interface UpdootSectionProps {
  post: PostSnippetFragment
  // fragment 파일을 code generator 로 type으로 만든  다음에 활용
}

export const UpdootSection: React.FC<UpdootSectionProps> = ({ post }) => {
  const [loadingState, setLoadingState] = useState<"updoot-loading" | "downdoot-loading" | "not-loading">("not-loading")
  // union을 이용한 useState 사용 예시  : 꼭 특정 상태를 boolean으로 할 필요는 없다.

  const [{ operation }, vote] = useVoteMutation();
  // 완료된 query에 관한 metadata를 알 수 있게 해주는 변수 operation

  return (

    <Flex direction={"column"} mr={5} align="center" justifyContent={"center"}>
      <IconButton
        aria-label='upvote'
        icon={<ChevronUpIcon boxSize={"24px"} />}
        onClick={async () => {
          if (post.voteStatus === 1) return;
          setLoadingState("updoot-loading");
          const response = await vote({ postId: post.id, value: 1 });
          setLoadingState("not-loading");
        }}
        isLoading={loadingState === "updoot-loading"}
        backgroundColor={post.voteStatus !== 1 ? "teal" : undefined}
      />

      {post.points}
      <IconButton
        aria-label='downvote'
        onClick={async () => {
          if (post.voteStatus === -1) return;
          setLoadingState("downdoot-loading");
          const response = await vote({ postId: post.id, value: -1 });
          setLoadingState("not-loading")
        }}
        isLoading={loadingState === "downdoot-loading"}
        icon={<ChevronDownIcon boxSize={"24px"}
        />}
        bgColor={post.voteStatus !== -1 ? "tomato" : undefined}
      />
    </Flex>
  );
}