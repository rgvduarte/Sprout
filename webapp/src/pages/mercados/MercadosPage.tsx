import { Page, PageHeader } from '../../components/ui';
import { WorldScene } from './scenes';

export default function MercadosPage() {
  return (
    <Page>
      <PageHeader title="Mercados" description="Calibração das cenas." />
      <div className="grid gap-6">
        <WorldScene world="azeite" levels={[1, 0.97, 0.16, 0]} label="Olival" fillOnMount />
        <WorldScene world="agua" levels={[0.68]} label="Nascente" />
        <WorldScene world="cafe" levels={[0]} label="Plantação" />
        <div className="grid grid-cols-3 gap-4">
          <WorldScene world="azeite" variant="band" levels={[1, 0.97, 0.16, 0]} label="Olival" />
          <WorldScene world="agua" variant="band" levels={[0.68]} label="Nascente" />
          <WorldScene world="cafe" variant="band" levels={[0]} label="Plantação" />
        </div>
      </div>
    </Page>
  );
}
