import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { Q } from '@nozbe/watermelondb';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { database } from '../../database';
import FotoRegistro from '../../database/models/FotoRegistro';
import Registro from '../../database/models/Registro';
import { useNetworkSync } from '../../hooks/useNetworkSync';
import { clearSession } from '../../storage/sessionStorage';
import { Session } from '../../types/session';

type Props = {
  session: Session;
  onLogout: () => void;
};

type TipoRegistro = 'COMPRA' | 'VENDA';

export function RecordsScreen({ session, onLogout }: Props) {
  const [tipo, setTipo] = useState<TipoRegistro>('COMPRA');
  const [dataHora, setDataHora] = useState(new Date());
  const [descricao, setDescricao] = useState('');
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [records, setRecords] = useState<Registro[]>([]);
  const [photoCountByRecord, setPhotoCountByRecord] = useState<Record<string, number>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const { online, syncing, syncNow } = useNetworkSync(session.token);

  const title = useMemo(() => (editingId ? 'Editar lancamento' : 'Novo lancamento'), [editingId]);

  useEffect(() => {
    const subscription = database
      .get<Registro>('registros')
      .query(Q.where('empresa_id', session.user.empresa_id), Q.sortBy('data_hora', Q.desc))
      .observe()
      .subscribe(setRecords);

    return () => subscription.unsubscribe();
  }, [session.user.empresa_id]);

  useEffect(() => {
    const subscription = database
      .get<FotoRegistro>('foto_registros')
      .query(Q.where('empresa_id', session.user.empresa_id))
      .observe()
      .subscribe((photos) => {
        const counts = photos.reduce<Record<string, number>>((acc, photo) => {
          acc[photo.registroId] = (acc[photo.registroId] || 0) + 1;
          return acc;
        }, {});
        setPhotoCountByRecord(counts);
      });

    return () => subscription.unsubscribe();
  }, [session.user.empresa_id]);

  function resetForm() {
    setTipo('COMPRA');
    setDataHora(new Date());
    setDescricao('');
    setPhotoUris([]);
    setEditingId(null);
  }

  async function addFromGallery() {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 0
    });

    if (result.didCancel) {
      return;
    }

    const uris = (result.assets || []).map((asset) => asset.uri).filter(Boolean) as string[];
    setPhotoUris((current) => [...current, ...uris]);
  }

  async function addFromCamera() {
    const result = await launchCamera({
      mediaType: 'photo',
      saveToPhotos: true
    });

    if (result.didCancel) {
      return;
    }

    const uris = (result.assets || []).map((asset) => asset.uri).filter(Boolean) as string[];
    setPhotoUris((current) => [...current, ...uris]);
  }

  function validate() {
    if (!tipo) {
      return 'Selecione o tipo.';
    }

    if (!dataHora) {
      return 'Selecione a data e hora.';
    }

    if (descricao.trim().length < 10) {
      return 'A descricao deve ter pelo menos 10 caracteres.';
    }

    return null;
  }

  async function saveRecord() {
    const validation = validate();
    if (validation) {
      Alert.alert('Revise os dados', validation);
      return;
    }

    let recordId = editingId;

    await database.write(async () => {
      const registros = database.get<Registro>('registros');

      if (editingId) {
        const existing = await registros.find(editingId);
        await existing.update((record) => {
          record.tipo = tipo;
          record.dataHora = dataHora.toISOString();
          record.descricao = descricao.trim();
          record.updatedAt = new Date().toISOString();
        });
      } else {
        const created = await registros.create((record) => {
          record.empresaId = session.user.empresa_id;
          record.usuarioId = session.user.id;
          record.tipo = tipo;
          record.dataHora = dataHora.toISOString();
          record.descricao = descricao.trim();
          record.updatedAt = new Date().toISOString();
        });
        recordId = created.id;
      }

      if (recordId) {
        const fotos = database.get<FotoRegistro>('foto_registros');
        for (const uri of photoUris) {
          await fotos.create((photo) => {
            photo.registroId = recordId as string;
            photo.empresaId = session.user.empresa_id;
            photo.localUri = uri;
            photo.remoteUri = '';
            photo.updatedAt = new Date().toISOString();
          });
        }
      }
    });

    resetForm();
    if (online) {
      syncNow().catch(console.error);
    }
  }

  function editRecord(record: Registro) {
    setEditingId(record.id);
    setTipo(record.tipo);
    setDataHora(new Date(record.dataHora));
    setDescricao(record.descricao);
    setPhotoUris([]);
  }

  async function logout() {
    await clearSession();
    onLogout();
  }

  return (
    <View style={styles.container}>
      <View style={styles.topbar}>
        <View>
          <Text style={styles.company}>{session.user.empresa.nome}</Text>
          <Text style={styles.user}>{session.user.nome}</Text>
        </View>
        <Pressable onPress={logout} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Sair</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.syncRow}>
          <Text style={[styles.status, online ? styles.online : styles.offline]}>
            {online ? 'Online' : 'Offline'}
          </Text>
          <Pressable disabled={syncing} onPress={syncNow} style={styles.syncButton}>
            {syncing ? <ActivityIndicator color="#fff" /> : <Text style={styles.syncText}>Sincronizar</Text>}
          </Pressable>
        </View>

        <View style={styles.panel}>
          <Text style={styles.title}>{title}</Text>

          <Text style={styles.label}>Tipo</Text>
          <View style={styles.pickerWrapper}>
            <Picker selectedValue={tipo} onValueChange={(value) => setTipo(value)}>
              <Picker.Item label="Compra" value="COMPRA" />
              <Picker.Item label="Venda" value="VENDA" />
            </Picker>
          </View>

          <Text style={styles.label}>Data e hora</Text>
          <View style={styles.dateRow}>
            <Pressable onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
              <Text style={styles.dateButtonText}>{dataHora.toLocaleDateString()}</Text>
            </Pressable>
            <Pressable onPress={() => setShowTimePicker(true)} style={styles.dateButton}>
              <Text style={styles.dateButtonText}>
                {dataHora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </Pressable>
          </View>

          {showDatePicker && (
            <DateTimePicker
              mode="date"
              onChange={(_, selected) => {
                setShowDatePicker(false);
                if (selected) {
                  const next = new Date(dataHora);
                  next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
                  setDataHora(next);
                }
              }}
              value={dataHora}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              mode="time"
              onChange={(_, selected) => {
                setShowTimePicker(false);
                if (selected) {
                  const next = new Date(dataHora);
                  next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
                  setDataHora(next);
                }
              }}
              value={dataHora}
            />
          )}

          <Text style={styles.label}>Descricao</Text>
          <TextInput
            multiline
            onChangeText={setDescricao}
            placeholder="Descreva o lancamento"
            style={[styles.input, styles.textArea]}
            value={descricao}
          />

          <Text style={styles.label}>Fotos</Text>
          <View style={styles.photoActions}>
            <Pressable onPress={addFromGallery} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Galeria</Text>
            </Pressable>
            <Pressable onPress={addFromCamera} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Camera</Text>
            </Pressable>
          </View>

          {photoUris.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewList}>
              {photoUris.map((uri) => (
                <Image key={uri} source={{ uri }} style={styles.preview} />
              ))}
            </ScrollView>
          )}

          <View style={styles.formActions}>
            {editingId && (
              <Pressable onPress={resetForm} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </Pressable>
            )}
            <Pressable onPress={saveRecord} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>{editingId ? 'Salvar alteracoes' : 'Salvar'}</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.listTitle}>Registros cadastrados</Text>
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ListEmptyComponent={<Text style={styles.empty}>Nenhum registro local ainda.</Text>}
          renderItem={({ item }) => (
            <View style={styles.recordCard}>
              <View style={styles.recordHeader}>
                <Text style={styles.recordType}>{item.tipo === 'COMPRA' ? 'Compra' : 'Venda'}</Text>
                <Text style={[styles.badge, item.sincronizado ? styles.synced : styles.pending]}>
                  {item.sincronizado ? 'Sincronizado' : 'Pendente'}
                </Text>
              </View>
              <Text style={styles.recordDate}>{new Date(item.dataHora).toLocaleString()}</Text>
              <Text style={styles.recordDescription}>{item.descricao}</Text>
              <Text style={styles.photoCount}>{photoCountByRecord[item.id] || 0} foto(s)</Text>
              <Pressable onPress={() => editRecord(item)} style={styles.editButton}>
                <Text style={styles.editButtonText}>Editar</Text>
              </Pressable>
            </View>
          )}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7fb'
  },
  topbar: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e6ef',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  company: {
    fontSize: 20,
    color: '#172033',
    fontWeight: '800'
  },
  user: {
    marginTop: 2,
    color: '#627086'
  },
  content: {
    padding: 16,
    gap: 16
  },
  syncRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  status: {
    fontWeight: '800'
  },
  online: {
    color: '#1f7a5c'
  },
  offline: {
    color: '#aa3e2f'
  },
  syncButton: {
    minHeight: 42,
    minWidth: 130,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#1f7a5c'
  },
  syncText: {
    color: '#fff',
    fontWeight: '800'
  },
  panel: {
    borderRadius: 8,
    backgroundColor: '#fff',
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#e1e6ef'
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#172033',
    marginBottom: 4
  },
  label: {
    color: '#293241',
    fontWeight: '700'
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#cbd3df',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden'
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10
  },
  dateButton: {
    flex: 1,
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#cbd3df',
    borderRadius: 8,
    backgroundColor: '#fff'
  },
  dateButtonText: {
    color: '#172033',
    fontWeight: '700'
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#cbd3df',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    color: '#172033'
  },
  textArea: {
    minHeight: 96,
    paddingTop: 12,
    textAlignVertical: 'top'
  },
  photoActions: {
    flexDirection: 'row',
    gap: 10
  },
  secondaryButton: {
    minHeight: 42,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1f7a5c',
    backgroundColor: '#fff'
  },
  secondaryButtonText: {
    color: '#1f7a5c',
    fontWeight: '800'
  },
  previewList: {
    marginTop: 4
  },
  preview: {
    width: 76,
    height: 76,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#dbe2ea'
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4
  },
  primaryButton: {
    minHeight: 46,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#1f7a5c'
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '800'
  },
  listTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#172033'
  },
  empty: {
    paddingVertical: 16,
    color: '#627086'
  },
  recordCard: {
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e6ef',
    gap: 6
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10
  },
  recordType: {
    color: '#172033',
    fontSize: 16,
    fontWeight: '800'
  },
  badge: {
    borderRadius: 8,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: '800'
  },
  synced: {
    backgroundColor: '#dff4ea',
    color: '#1f7a5c'
  },
  pending: {
    backgroundColor: '#fdebd7',
    color: '#9b4d14'
  },
  recordDate: {
    color: '#627086'
  },
  recordDescription: {
    color: '#293241',
    lineHeight: 20
  },
  photoCount: {
    color: '#627086',
    fontWeight: '700'
  },
  editButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8
  },
  editButtonText: {
    color: '#1f7a5c',
    fontWeight: '800'
  }
});
