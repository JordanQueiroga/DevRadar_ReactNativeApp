import React, { useEffect, useState } from "react";
import MapView, { Marker, Callout } from "react-native-maps";
import { StyleSheet, Image, Text, View, TextInput, TouchableOpacity, Keyboard } from "react-native";
import { requestPermissionsAsync, getCurrentPositionAsync } from "expo-location";
import { MaterialIcons } from "@expo/vector-icons";
import api from "../services/api";
import { connect, disconnect, subscribeToNewDevs } from "../services/socket";

// o teclado não ficar em cima do inputtext usar o Keyboard do react-native para pegar a altura do teclado e quando o teclado estiver em amostra para alterar a posição do input;


function Main({ navigation }) {//esta propriedade vem de forma automática para tds as paginas da aplicação
    const [currentRegion, setCurrentRegion] = useState(null)
    const [devs, setDevs] = useState([]);
    const [techs, setText] = useState("")

    useEffect(() => {
        async function loadInitialPosition() {
            const { granted } = await requestPermissionsAsync();
            if (granted) {//se ele tiver permissão
                const { coords } = await getCurrentPositionAsync({//pega a posição do usuario
                    /* 
                    se true -> só funciona se o gps estiver ligado se tiver desligado vai retornar erro
                    se false -> pega a geolocalização utilizando os dados do wifi e internet */
                    enableHighAccuracy: true
                });

                const { latitude, longitude } = coords;
                setCurrentRegion({
                    latitude,
                    longitude,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02
                });
            }

        }
        loadInitialPosition();
    }, []);

    useEffect(() => {
        subscribeToNewDevs(dev => setDevs([...devs, dev]));
    }, [devs]);//quando a variável devs mudar, execute esta função

    function handleRegionChanged(region) {
        setCurrentRegion(region);
    }


    function setupWebSocket() {
        disconnect();
        const { latitude, longitude } = currentRegion;
        connect(latitude, longitude, techs);
    }

    async function loadDevs() {
        const { latitude, longitude } = currentRegion;
        const response = await api.get("/search", {
            params: {
                longitude: latitude,/* isso deve ser alterado no frontend wewb, eu estou salvando os dados inversamente */
                latitude: longitude,
                techs
            }
        });
        setDevs(response.data.devs)
        setupWebSocket();
    }


    if (!currentRegion) {
        return null;
    }

    return (
        <>
            <MapView onRegionChangeComplete={handleRegionChanged} initialRegion={currentRegion} style={styles.map} >
                {devs.map((dev, i) => (
                    <Marker key={i} coordinate={{ latitude: dev.location.coordinates[1], longitude: dev.location.coordinates[0] }}>
                        <Image style={styles.avatar} source={{ uri: dev.avatar_url }} />
                        <Callout onPress={() => {
                            navigation.navigate("Profile", { github_username: dev.github_username })
                        }}>{/* é tudo o que vai aparecer quando clicar no avatar */}
                            <View style={styles.callout}>
                                <Text style={styles.devName}>{dev.name}</Text>
                                <Text style={styles.devBio}>{dev.bio}</Text>
                                <Text style={styles.devTechs}>{dev.techs.join(", ")}</Text>
                            </View>
                        </Callout>
                    </Marker>
                ))}
            </MapView>
            <View style={styles.searchForm}>
                <TextInput onChangeText={setText} style={styles.searchInput} placeholder="Buscar devs por techs..." placeholderTextColor="#999" autoCapitalize="words" autoCorrect={false} />
                <TouchableOpacity onPress={() => loadDevs()} style={styles.loadButton}>
                    <MaterialIcons name="my-location" size={20} color="#FFF" />
                </TouchableOpacity>

            </View>
        </>
    )
}

const styles = StyleSheet.create({
    map: {
        flex: 1
    },
    avatar: {
        width: 54,
        height: 54,
        borderRadius: 4,
        borderWidth: 4,
        borderColor: "#FFF"
    },
    callout: {
        width: 260
    },
    devName: {
        fontWeight: "bold",
        fontSize: 16,
    },
    devBio: {
        color: "#666",
        marginTop: 5
    },
    devTechs: {
        marginTop: 5
    },
    searchForm: {
        position: "absolute",
        top: 20,
        left: 20,
        right: 20,
        zIndex: 5,
        flexDirection: "row",
    },
    searchInput: {
        flex: 1,
        height: 50,
        backgroundColor: "#FFF",
        color: "#333",
        borderRadius: 25,
        paddingHorizontal: 20,
        fontSize: 16,
        /* inicio sombra ios Sombra */
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowOffset: {
            width: 4,
            height: 4,
        },
        /* fim sombra IOS */
        /* Inicio sombra android */
        elevation: 2,
        /* FIm sombra android */
    },
    loadButton: {
        width: 50,
        height: 50,
        backgroundColor: "#8D4Dff",
        borderRadius: 25,
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 15,
    }
})

export default Main;