import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ShoppingList {
  id: string;
  name: string;
  items: string[];
  createdAt: Date;
}

export default function ListsScreen() {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [listName, setListName] = useState('');
  const [currentList, setCurrentList] = useState<ShoppingList | null>(null);
  const [newItem, setNewItem] = useState('');

  const createList = () => {
    if (!listName.trim()) {
      Alert.alert('Erro', 'Digite um nome para a lista');
      return;
    }

    const newList: ShoppingList = {
      id: Date.now().toString(),
      name: listName,
      items: [],
      createdAt: new Date(),
    };

    setLists([...lists, newList]);
    setListName('');
    setModalVisible(false);
    Alert.alert('Sucesso!', 'Lista criada com sucesso');
  };

  const deleteList = (id: string) => {
    Alert.alert(
      'Confirmar',
      'Deseja realmente excluir esta lista?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            setLists(lists.filter(l => l.id !== id));
          },
        },
      ]
    );
  };

  const openEditList = (list: ShoppingList) => {
    setCurrentList(list);
    setEditModalVisible(true);
  };

  const addItemToList = () => {
    if (!newItem.trim() || !currentList) return;

    setLists(lists.map(l =>
      l.id === currentList.id
        ? { ...l, items: [...l.items, newItem] }
        : l
    ));
    setNewItem('');
  };

  const removeItemFromList = (item: string) => {
    if (!currentList) return;

    setLists(lists.map(l =>
      l.id === currentList.id
        ? { ...l, items: l.items.filter(i => i !== item) }
        : l
    ));
  };

  const renderList = ({ item }: { item: ShoppingList }) => (
    <TouchableOpacity
      style={styles.listCard}
      onPress={() => openEditList(item)}
    >
      <View style={styles.listIcon}>
        <Ionicons name="list" size={28} color="#4a6741" />
      </View>
      <View style={styles.listInfo}>
        <Text style={styles.listName}>{item.name}</Text>
        <Text style={styles.listItems}>
          {item.items.length} {item.items.length === 1 ? 'item' : 'itens'}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteList(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color="#ff6b6b" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {lists.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="list-outline" size={80} color="#d1d5db" />
          <Text style={styles.emptyTitle}>Nenhuma lista</Text>
          <Text style={styles.emptySubtitle}>
            Crie listas de compras para organizar melhor
          </Text>
        </View>
      ) : (
        <FlatList
          data={lists}
          renderItem={renderList}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={32} color="#ffffff" />
      </TouchableOpacity>

      {/* Modal Criar Lista */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nova Lista</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome da lista"
              value={listName}
              onChangeText={setListName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setListName('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={createList}
              >
                <Text style={styles.createButtonText}>Criar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Editar Lista */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.editModalContent]}>
            <View style={styles.editModalHeader}>
              <Text style={styles.modalTitle}>{currentList?.name}</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={28} color="#2d2d2d" />
              </TouchableOpacity>
            </View>

            <View style={styles.addItemContainer}>
              <TextInput
                style={styles.addItemInput}
                placeholder="Adicionar item..."
                value={newItem}
                onChangeText={setNewItem}
              />
              <TouchableOpacity
                style={styles.addItemButton}
                onPress={addItemToList}
              >
                <Ionicons name="add" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={currentList?.items || []}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <View style={styles.listItemCard}>
                  <Text style={styles.listItemText}>{item}</Text>
                  <TouchableOpacity onPress={() => removeItemFromList(item)}>
                    <Ionicons name="close-circle" size={24} color="#ff6b6b" />
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyListText}>
                  Nenhum item adicionado ainda
                </Text>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 16,
  },
  listCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d2d2d',
    marginBottom: 4,
  },
  listItems: {
    fontSize: 14,
    color: '#6b6b6b',
  },
  deleteButton: {
    padding: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4a6741',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d2d2d',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b6b6b',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  editModalContent: {
    height: '70%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d2d2d',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  createButton: {
    backgroundColor: '#4a6741',
  },
  cancelButtonText: {
    color: '#2d2d2d',
    fontSize: 16,
    fontWeight: '600',
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addItemContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  addItemInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 8,
  },
  addItemButton: {
    backgroundColor: '#4a6741',
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  listItemText: {
    fontSize: 16,
    color: '#2d2d2d',
  },
  emptyListText: {
    textAlign: 'center',
    color: '#6b6b6b',
    fontSize: 14,
    marginTop: 20,
  },
});