import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  category: number;
  thumbnail_url: string;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [favorites, setFavorites] = useState<
    Omit<Food, 'extras' | 'formattedPrice'>[]
  >([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      // Load a specific food with extras based on routeParams id
      api.get<Food>(`foods/${routeParams.id}`).then(({ data }) => {
        setFood({ ...data, formattedPrice: formatValue(data.price) });
        setExtras(
          data.extras.map(extra => {
            return { ...extra, quantity: 0 };
          }),
        );
      });
    }

    loadFood();
  }, [routeParams.id]);

  useEffect(() => {
    async function findFavorites(): Promise<void> {
      api
        .get<Omit<Food, 'extras' | 'formattedPrice'>[]>('favorites')
        .then(({ data }) => {
          setFavorites(data);
          const favoriteIndex = data.findIndex(
            favorite => favorite.id === food.id,
          );

          if (favoriteIndex >= 0) setIsFavorite(true);
        });
    }

    findFavorites();
  }, [food.id]);

  function handleIncrementExtra(id: number): void {
    // Increment extra quantity
    setExtras(oldState =>
      oldState.map(extra => {
        if (extra.id === id) {
          return {
            ...extra,
            quantity: extra.quantity + 1,
          };
        }

        return extra;
      }),
    );
  }

  function handleDecrementExtra(id: number): void {
    // Decrement extra quantity

    const udpatedExtras = extras.map(extra => {
      if (extra.id === id && extra.quantity !== 0) {
        return {
          ...extra,
          quantity: extra.quantity - 1,
        };
      }

      return extra;
    });

    setExtras(udpatedExtras);
  }

  function handleIncrementFood(): void {
    // Increment food quantity
    setFoodQuantity(quantity => quantity + 1);
  }

  function handleDecrementFood(): void {
    // Decrement food quantity
    if (foodQuantity !== 1) setFoodQuantity(quantity => quantity - 1);
  }

  const toggleFavorite = useCallback(async () => {
    // Toggle if food is favorite or not

    const favoriteIndex = favorites.findIndex(
      favorite => favorite.id === food.id,
    );

    const {
      id,
      name,
      description,
      price,
      category,
      image_url,
      thumbnail_url,
    } = food;

    favoriteIndex >= 0
      ? api
          .delete(`favorites/${food.id}`)
          .then(() => favorites.filter(favorite => favorite.id !== food.id))
      : api
          .post('favorites', {
            id,
            name,
            description,
            price,
            category,
            image_url,
            thumbnail_url,
          })
          .then(({ data }) => setFavorites(data));

    setIsFavorite(!isFavorite);
  }, [favorites, food, isFavorite]);

  const cartTotal = useMemo(() => {
    // Calculate cartTotal
    const extrasTotal = extras
      .map(({ quantity, value }) => {
        return quantity * value;
      })
      .reduce((acc, price) => {
        return acc + price;
      }, 0);

    return formatValue((extrasTotal + food.price) * foodQuantity);
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    // Finish the order and save on the API
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
