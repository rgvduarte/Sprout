import { useParams } from 'react-router-dom';
import { Page, PageHeader } from '../../components/ui';
import { getWorld, isWorldId } from '../../data';
import NotFound from '../../app/NotFound';

export default function MundoPage() {
  const { mundo } = useParams();
  if (!isWorldId(mundo)) return <NotFound />;
  const world = getWorld(mundo);
  return (
    <Page>
      <PageHeader title={world.nome} description={world.tagline} />
      <p className="measure text-muted">Este ecrã ainda está a ser construído.</p>
    </Page>
  );
}
