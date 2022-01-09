import { DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { Box, BoxProps, IconButton, Link } from '@chakra-ui/react';
import NextLink from 'next/link';
import { useMeQuery } from '../generated/graphql';

// 다른 타입과 합성할 때는 type 선언으로 한다.
type EditDeletePostButtonsProps = BoxProps & { onDelete: Function, postId: number, creatorId: number }

// BoxProps만 남겨두고 싶으면 먼저 그것이 아닌 필수 필드들만 구조 분해하고 나머지를 ...처리한다.
export const EditDeletePostButtons: React.FC<EditDeletePostButtonsProps> = (
  { onDelete, postId, creatorId, ...boxProps }) => {

  const [{ data: meData }] = useMeQuery();
  // urql에 의해 cache될 것이기 때문에 query를 여러번 진행할 것이라 생각하지 말자.
  if (meData && meData?.me?.id !== creatorId) {
    return null;
  }

  return (
    // 받았던 Props 객체를 분해하면 사실상 Box component의 Props로 들어가는 것과 같은 효과다.
    <Box {...boxProps}>
      <IconButton aria-label='delete-post' icon={<DeleteIcon boxSize={5} />} onClick={() => onDelete()}
      />
      <NextLink href="/post/edit/[id]" as={`/post/edit/${postId}`}>
        <IconButton as={Link} aria-label='update-post' icon={<EditIcon boxSize={5} />}
          ml={2}
        />
      </NextLink>
    </Box>
  );
}