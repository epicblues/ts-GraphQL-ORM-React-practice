import { withUrqlClient } from 'next-urql';
import { NavBar } from '../components/NavBar';
import { usePostsQuery } from '../generated/graphql';
import { createUrqlClient } from '../utils/createUrqlClient';


const Index = () => {
  const [{ data }] = usePostsQuery();
  // SSR을 true로 해 놓을 경우 fetching이 false로 될 때 까지 페이지 응답을 보내지 않는다.

  return (
    <>
      <NavBar />
      <div>Hello World</div>
      <br />
      {data ? data.posts.map(p => <div key={p.id}>{p.title}</div>) : <div>Loading</div>}
    </>);

}
export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
// server side에서 graphql 쿼리를 실행하고 데이터를 미리 가져오도록 하게 하는 wrapper
// 두 번째 parameter로 ssr을 true로 해 놓으면 서버에서 응답을 받을 때 까지 페이지를 렌더링 하지 않는다.