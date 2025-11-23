import { Cavan } from '../models/Cavan';
import { InMemoryRepository } from './InMemoryRepository';

export class CavanRepository extends InMemoryRepository<Cavan> {
  // 현재는 특별한 쿼리가 필요 없으므로 기본적인 CRUD 기능만 상속받아 사용합니다.
  // 추후 특정 조건으로 카라반을 검색하는 기능이 필요하면 여기에 추가할 수 있습니다.
}
