import {cookies} from 'next/headers';
import ClientsClient from '../ClientsClient';
export default function ClientDetailsPage({params}:{params:{id:string}}){
  return <ClientsClient lang={cookies().get('lang')?.value==='ar'?'ar':'fr'} clientId={params.id}/>;
}
