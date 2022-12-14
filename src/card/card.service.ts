import { Injectable } from '@nestjs/common';
import { User, UserCard } from '../user/user.schema';
import { UuidService } from '../uuid/uuid.service';
import { ContentAccessorService } from '../content/content-accessor.service';
import { ICard } from './card.interface';

//FIXME: might need to group by passcode or something
// might be issue when 2 codes point to 1 card name with 5 different ids
// 5 different cards would be populated, but we would only have 1 actual card
// per add to the trunk
@Injectable()
export class CardService {
  constructor(
    private readonly uuidService: UuidService,
    private readonly contentAccessorService: ContentAccessorService,
  ) {}

  /**
   * Get the card content data
   * @param cardId cardId of the card being retrieved
   * @returns ICard content data
   */
  getCardContent(cardId: string): ICard {
    const card =
      this.contentAccessorService.getContentEntryByIdAndContentTypeOptional(
        'cards',
        cardId,
      );

    if (!card) throw new Error('card does not exist');

    return card;
  }

  /**
   * Get the contents of the card trunk
   * @param user user owning the trunk
   * @returns the trunk
   */
  getTrunk(user: User): UserCard[] {
    return user.trunk;
  }

  /**
   * Get the content data of the card trunk
   * @param user user retrieving the contents of their trunk
   * @returns the trunk's content data
   */
  getTrunkContents(user: User): ICard[] {
    const trunkContent: ICard[] = [];
    const userTrunk = this.getTrunk(user);

    userTrunk.forEach((x) => {
      trunkContent.push(this.getCardContent(x.contentId));
    });

    return trunkContent;
  }

  /**
   * Get a card from the trunk
   * @param user user owning the card
   * @param cardId card being retrieved
   * @returns the card or null if it doesn't exist
   */
  getCardFromTrunk(user: User, cardId: string): UserCard | null {
    return user.trunk.find((card) => card.contentId === cardId) ?? null;
  }

  /**
   * Add a card to the trunk
   * @param user user getting the card
   * @param cardId cardId being added
   * @returns the trunk
   */
  addToTrunk(user: User, cardId: string): UserCard {
    let card = this.getCardFromTrunk(user, cardId);
    if (card) {
      ++card.copies;
      return card;
    } else {
      const uuid = this.uuidService.getUuid();
      card = new UserCard(uuid, cardId);
      user.trunk.push(card);
      return card;
    }
  }

  /**
   * Add cards to the trunk given a passcode. Note: One passcode
   * can be linked to multiple cardIds, ex: 'Dark Magician-Dark Magician'
   * and 'Dark Magician-Blue-Eyes White Dragon' both have passcode 46986414
   * @param user user getting the cards
   * @param passcode passcode of the cards being added to the trunk
   * @returns the cards that were added to the trunk
   */
  addToTrunkByPasscode(user: User, passcode: string): UserCard[] {
    const userCards: UserCard[] = [];
    const contentCards =
      this.contentAccessorService.getAllContentCardsByPasscode(passcode);

    contentCards.forEach((card) => {
      const userCard = this.addToTrunk(user, card.id);
      userCards.push(userCard);
    });

    // TODO: need to add these cards to the userBoosterPack list?

    return userCards;
  }
}
