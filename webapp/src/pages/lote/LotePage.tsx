import { useParams } from 'react-router-dom';
import { Page, PageHeader } from '../../components/ui';
import { useData } from '../../state';
import NotFound from '../../app/NotFound';

export default function LotePage() {
  const { loteId } = useParams();
  const { getLot } = useData();
  const lot = loteId ? getLot(loteId) : undefined;
  if (!lot) return <NotFound />;
  return (
    <Page>
      <PageHeader title={`${lot.id} · ${lot.title}`} description={lot.product} />
      <p className="measure text-muted">Este ecrã ainda está a ser construído.</p>
    </Page>
  );
}
