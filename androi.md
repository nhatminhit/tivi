# Prompt tạo App Android IPTV

> Paste vào Google AI Studio, chọn model Gemini 2.5 Pro, yêu cầu tạo toàn bộ project Android.

---

Bạn là một lập trình viên Android chuyên nghiệp. Hãy tạo cho tôi một app xem truyền hình IPTV hoàn chỉnh.

## Tech Stack

- Ngôn ngữ: **Kotlin**
- UI: **Jetpack Compose + Material 3**
- Player: **Media3 ExoPlayer** (hỗ trợ HLS .m3u8)
- Database: **Room**
- Networking: **OkHttp + Retrofit**
- Ảnh: **Coil**
- DI: **Hilt**
- Architecture: **MVVM**

## Cấu trúc thư mục

```
app/src/main/java/com/tivi/app/
├── TiviApplication.kt
├── MainActivity.kt
├── di/
│   ├── AppModule.kt
│   └── DatabaseModule.kt
├── data/
│   ├── local/
│   │   ├── AppDatabase.kt
│   │   ├── dao/
│   │   │   ├── PlaylistDao.kt
│   │   │   └── ChannelDao.kt
│   │   └── entity/
│   │       ├── PlaylistEntity.kt
│   │       └── ChannelEntity.kt
│   ├── remote/
│   │   └── M3UService.kt
│   └── repository/
│       └── PlaylistRepository.kt
├── domain/
│   ├── model/
│   │   ├── Channel.kt
│   │   └── PlaylistMeta.kt
│   └── parser/
│       └── M3UParser.kt
├── ui/
│   ├── theme/
│   │   ├── Theme.kt
│   │   ├── Color.kt
│   │   └── Type.kt
│   ├── navigation/
│   │   └── NavGraph.kt
│   ├── player/
│   │   ├── PlayerScreen.kt
│   │   ├── PlayerViewModel.kt
│   │   └── PlayerControls.kt
│   ├── channels/
│   │   ├── ChannelListScreen.kt
│   │   └── ChannelListViewModel.kt
│   ├── sidebar/
│   │   └── ChannelSidebar.kt
│   ├── settings/
│   │   ├── SettingsScreen.kt
│   │   └── SettingsViewModel.kt
│   ├── home/
│   │   ├── HomeScreen.kt
│   │   └── HomeViewModel.kt
│   └── components/
│       ├── ChannelCard.kt
│       ├── LoadingSpinner.kt
│       └── PlaylistUploader.kt
res/
├── values/
│   ├── strings.xml
│   └── themes.xml
└── raw/
    └── (trống)
```

## Yêu cầu chi tiết từng file

### 1. Domain Model (domain/model/)

**Channel.kt:**

```kotlin
data class Channel(
    val id: String,
    val name: String,
    val url: String,
    val logo: String,
    val group: String,
    val tvgId: String,
    val tvgName: String,
    val userAgent: String? = null,
    val referer: String? = null,
    val catchup: String? = null,
    val catchupDays: String? = null,
    val catchupSource: String? = null
)
```

**PlaylistMeta.kt:**

```kotlin
data class PlaylistMeta(
    val id: String,
    val name: String,
    val source: String, // "url" hoặc "file"
    val url: String? = null,
    val channelCount: Int,
    val createdAt: Long
)
```

### 2. Database Entity (data/local/entity/)

- **PlaylistEntity.kt:** Entity với id là primary key, các field tương ứng PlaylistMeta, tableName = "playlists"
- **ChannelEntity.kt:** Entity với id là primary key, thêm field playlistId (có @Index), tableName = "channels", các field tương ứng Channel

### 3. DAO (data/local/dao/)

**PlaylistDao.kt:**

```kotlin
@Dao
interface PlaylistDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPlaylist(meta: PlaylistEntity)

    @Query("SELECT * FROM playlists ORDER BY createdAt DESC")
    fun getAllPlaylists(): Flow<List<PlaylistEntity>>

    @Query("SELECT * FROM playlists WHERE id = :id")
    suspend fun getPlaylistById(id: String): PlaylistEntity?

    @Delete
    suspend fun deletePlaylist(meta: PlaylistEntity)

    @Query("DELETE FROM playlists WHERE id = :id")
    suspend fun deleteById(id: String)
}
```

**ChannelDao.kt:**

```kotlin
@Dao
interface ChannelDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertChannels(channels: List<ChannelEntity>)

    @Query("SELECT * FROM channels WHERE playlistId = :playlistId")
    fun getChannelsByPlaylist(playlistId: String): Flow<List<ChannelEntity>>

    @Query("DELETE FROM channels WHERE playlistId = :playlistId")
    suspend fun deleteByPlaylistId(playlistId: String)

    @Query("""
        SELECT * FROM channels
        WHERE playlistId = :playlistId
        AND (name LIKE '%' || :query || '%' OR 'group' LIKE '%' || :query || '%')
    """)
    fun searchChannels(playlistId: String, query: String): Flow<List<ChannelEntity>>

    @Query("SELECT * FROM channels WHERE playlistId = :playlistId AND id = :channelId LIMIT 1")
    suspend fun getChannelById(playlistId: String, channelId: String): ChannelEntity?
}
```

### 4. AppDatabase.kt

```kotlin
@Database(entities = [PlaylistEntity::class, ChannelEntity::class], version = 1, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {
    abstract fun playlistDao(): PlaylistDao
    abstract fun channelDao(): ChannelDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null
        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                Room.databaseBuilder(context, AppDatabase::class.java, "tivi-db")
                    .fallbackToDestructiveMigration()
                    .build().also { INSTANCE = it }
            }
        }
    }
}
```

### 5. M3UParser (domain/parser/M3UParser.kt)

```kotlin
object M3UParser {
    fun parse(content: String, playlistId: String): List<Channel> {
        val channels = mutableListOf<Channel>()
        val lines = content.split("\n")
        var currentName = ""
        var currentTvgId = ""
        var currentLogo = ""
        var currentGroup = ""
        var currentUserAgent: String? = null
        var currentReferer: String? = null
        var currentCatchup: String? = null
        var currentCatchupDays: String? = null
        var currentCatchupSource: String? = null

        for (line in lines) {
            val trimmed = line.trim()
            when {
                trimmed.startsWith("#EXTINF:") -> {
                    // Reset
                    currentUserAgent = null
                    currentReferer = null
                    // Parse name: sau dấu phẩy cuối cùng
                    val commaIndex = trimmed.lastIndexOf(",")
                    currentName = if (commaIndex != -1) trimmed.substring(commaIndex + 1).trim() else "Unknown"
                    val attrStr = if (commaIndex != -1) trimmed.substring(8, commaIndex) else trimmed.substring(8)
                    // Regex attributes
                    Regex("""tvg-id="([^"]*)"""").find(attrStr)?.let { currentTvgId = it.groupValues[1] }
                    Regex("""tvg-logo="([^"]*)"""").find(attrStr)?.let { currentLogo = it.groupValues[1] }
                    Regex("""group-title="([^"]*)"""").find(attrStr)?.let { currentGroup = it.groupValues[1] }
                    Regex("""catchup="([^"]*)"""").find(attrStr)?.let { currentCatchup = it.groupValues[1] }
                    Regex("""catchup-days="([^"]*)"""").find(attrStr)?.let { currentCatchupDays = it.groupValues[1] }
                    Regex("""catchup-source="([^"]*)"""").find(attrStr)?.let { currentCatchupSource = it.groupValues[1] }
                }
                trimmed.startsWith("#EXTVLCOPT:") -> {
                    val opt = trimmed.removePrefix("#EXTVLCOPT:").trim()
                    when {
                        opt.startsWith("http-user-agent=") -> currentUserAgent = opt.removePrefix("http-user-agent=")
                        opt.startsWith("http-referrer=") -> currentReferer = opt.removePrefix("http-referrer=")
                        opt.startsWith("http-referer=") -> currentReferer = opt.removePrefix("http-referer=")
                    }
                }
                trimmed.startsWith("http://") || trimmed.startsWith("https://") -> {
                    if (currentName.isNotEmpty()) {
                        channels.add(Channel(
                            id = currentTvgId.ifEmpty { "ch-${channels.size}" },
                            name = currentName,
                            url = trimmed,
                            logo = currentLogo,
                            group = currentGroup.ifEmpty { "Uncategorized" },
                            tvgId = currentTvgId,
                            tvgName = currentTvgId,
                            userAgent = currentUserAgent,
                            referer = currentReferer,
                            catchup = currentCatchup,
                            catchupDays = currentCatchupDays,
                            catchupSource = currentCatchupSource
                        ))
                    }
                    // Reset
                    currentName = ""
                    currentTvgId = ""
                    currentLogo = ""
                    currentGroup = ""
                }
            }
        }
        return channels
    }

    fun generateId(): String =
        "pl-${System.currentTimeMillis()}-${(100000..999999).random()}"
}
```

### 6. PlaylistRepository (data/repository/PlaylistRepository.kt)

```kotlin
class PlaylistRepository @Inject constructor(
    private val playlistDao: PlaylistDao,
    private val channelDao: ChannelDao,
    private val okHttpClient: OkHttpClient,
    private val prefs: SharedPreferences
) {
    companion object {
        const val KEY_ACTIVE_ID = "active_playlist_id"
        const val KEY_DEFAULT_LINK = "default_link"
        const val KEY_AUTO_LOADED = "auto_loaded"
        const val BUILTIN_LINK = "https://raw.githubusercontent.com/vietng228/m3u/main/new.m3u"
    }

    suspend fun fetchAndSaveFromUrl(url: String) {
        var fetchUrl = url
            .replace("github.com", "raw.githubusercontent.com")
            .replace("/blob/", "/")
        val request = Request.Builder().url(fetchUrl)
            .header("User-Agent", "Mozilla/5.0 (compatible; TiviIPTV/1.0)")
            .build()
        val response = okHttpClient.newCall(request).await()
        if (!response.isSuccessful) throw Exception("HTTP ${response.code}")
        val content = response.body?.string() ?: throw Exception("Empty response")
        val playlistId = generateId()
        val channels = M3UParser.parse(content, playlistId)
        val meta = PlaylistEntity(
            id = playlistId,
            name = url.substringAfterLast("/"),
            source = "url",
            url = url,
            channelCount = channels.size,
            createdAt = System.currentTimeMillis()
        )
        playlistDao.insertPlaylist(meta)
        channelDao.insertChannels(channels.map { it.toEntity(playlistId) })
        setActivePlaylistId(playlistId)
    }

    fun getAllPlaylists(): Flow<List<PlaylistMeta>> =
        playlistDao.getAllPlaylists().map { list -> list.map { it.toDomain() } }

    fun getChannelsByPlaylist(playlistId: String): Flow<List<Channel>> =
        channelDao.getChannelsByPlaylist(playlistId).map { list -> list.map { it.toDomain() } }

    suspend fun getChannelsOnce(playlistId: String): List<Channel> =
        channelDao.getChannelsByPlaylist(playlistId).first().map { it.toDomain() }

    suspend fun getChannelById(playlistId: String, channelId: String): Channel? =
        channelDao.getChannelById(playlistId, channelId)?.toDomain()

    fun searchChannels(playlistId: String, query: String): Flow<List<Channel>> =
        channelDao.searchChannels(playlistId, query).map { list -> list.map { it.toDomain() } }

    suspend fun deletePlaylist(id: String) {
        channelDao.deleteByPlaylistId(id)
        playlistDao.deleteById(id)
    }

    fun getActivePlaylistId(): String? = prefs.getString(KEY_ACTIVE_ID, null)
    fun setActivePlaylistId(id: String) = prefs.edit().putString(KEY_ACTIVE_ID, id).apply()
    fun clearActivePlaylistId() = prefs.edit().remove(KEY_ACTIVE_ID).apply()

    fun getDefaultLink(): String = prefs.getString(KEY_DEFAULT_LINK, BUILTIN_LINK) ?: BUILTIN_LINK
    fun setDefaultLink(url: String) = prefs.edit().putString(KEY_DEFAULT_LINK, url).apply()
    fun clearDefaultLink() = prefs.edit().remove(KEY_DEFAULT_LINK).apply()

    fun isAutoLoaded(): Boolean = prefs.getBoolean(KEY_AUTO_LOADED, false)
    fun setAutoLoaded(v: Boolean) = prefs.edit().putBoolean(KEY_AUTO_LOADED, v).apply()

    suspend fun resolveDefaultChannel(playlistId: String): String? {
        val channels = getChannelsOnce(playlistId)
        val vtv1 = channels.find { it.id == "vtv1hd" || it.name.startsWith("vtv1", true) }
        return vtv1?.id ?: channels.firstOrNull()?.id
    }
}
```

### 7. DI Modules (di/)

**AppModule.kt:**

```kotlin
@Module
@InstallIn(SingletonComponent::class)
object AppModule {
    @Provides @Singleton
    fun provideOkHttp(): OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()

    @Provides @Singleton
    fun provideSharedPreferences(@ApplicationContext ctx: Context): SharedPreferences =
        ctx.getSharedPreferences("tivi-prefs", Context.MODE_PRIVATE)
}
```

**DatabaseModule.kt:**

```kotlin
@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {
    @Provides @Singleton
    fun provideDatabase(@ApplicationContext ctx: Context): AppDatabase =
        AppDatabase.getInstance(ctx)

    @Provides fun providePlaylistDao(db: AppDatabase) = db.playlistDao()
    @Provides fun provideChannelDao(db: AppDatabase) = db.channelDao()
}
```

### 8. Theme (ui/theme/)

- **Color.kt:** Material 3 dark theme colors với primary xanh dương
- **Type.kt:** Typography mặc định
- **Theme.kt:** `TiviTheme` composable, dark theme mặc định, dùng `dynamicDarkColorScheme()` cho Android 12+, fallback `darkColorScheme()`

### 9. Navigation (ui/navigation/NavGraph.kt)

```kotlin
@Composable
fun TiviNavGraph(navController: NavHostController = rememberNavController()) {
    NavHost(navController, startDestination = "home") {
        composable("home") {
            HomeScreen(
                onNavigateToPlayer = { channelId ->
                    navController.navigate("player/$channelId") {
                        popUpTo("home") { saveState = true }
                        launchSingleTop = true
                        restoreState = true
                    }
                }
            )
        }
        composable(
            route = "player/{channelId}",
            arguments = listOf(navArgument("channelId") { type = NavType.StringType })
        ) { backStackEntry ->
            PlayerScreen(
                channelId = backStackEntry.arguments?.getString("channelId") ?: "",
                onNavigateToSettings = { navController.navigate("settings") }
            )
        }
        composable("settings") {
            SettingsScreen(onNavigateBack = { navController.popBackStack() })
        }
    }
}
```

### 10. Player (ui/player/)

**PlayerViewModel.kt:**

```kotlin
@HiltViewModel
class PlayerViewModel @Inject constructor(
    private val repository: PlaylistRepository,
    savedStateHandle: SavedStateHandle
) : ViewModel() {
    private val channelId: String = savedStateHandle.get<String>("channelId") ?: ""

    data class PlayerUiState(
        val currentChannel: Channel? = null,
        val isPlaying: Boolean = false,
        val isSidebarVisible: Boolean = false,
        val channels: List<Channel> = emptyList()
    )

    private val _uiState = MutableStateFlow(PlayerUiState())
    val uiState: StateFlow<PlayerUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            val playlistId = repository.getActivePlaylistId() ?: return@launch
            repository.getChannelsByPlaylist(playlistId).collect { channels ->
                _uiState.update { it.copy(channels = channels) }
                val ch = channels.find { c -> c.id == channelId }
                    ?: channels.firstOrNull()
                if (ch != null) {
                    _uiState.update { it.copy(currentChannel = ch) }
                }
            }
        }
    }

    fun toggleSidebar() {
        _uiState.update { it.copy(isSidebarVisible = !it.isSidebarVisible) }
    }

    fun hideSidebar() {
        _uiState.update { it.copy(isSidebarVisible = false) }
    }

    fun selectChannel(channel: Channel) {
        _uiState.update { it.copy(currentChannel = channel, isSidebarVisible = false) }
    }
}
```

**PlayerScreen.kt:**

- @OptIn(ExperimentalMaterial3Api::class)
- Scaffold với topAppBar (hiện tên kênh + hamburger icon toggle sidebar)
- Nội dung: Box full màn hình (hoặc Row nếu sidebar visible)
- **ExoPlayer composable:**
  - `rememberMediaSessionConnector()`
  - `DisposableEffect` tạo ExoPlayer instance
  - `AndroidView` bao PlayerView
  - Cấu hình PlayerView: `setShowBuffering(SHOW_BUFFERING_WHEN_PREPARING)`, `useController = false` (ẩn hoàn toàn controls mặc định)
  - Click → toggle play/pause
  - Double click → toggle fullscreen (WindowInsetsController hoặc immersive)
  - Nút fullscreen overlay bottom-right (hiện khi tap màn hình)
  - Auto-hide overlay sau 3 giây
- Bottom bar: logo + tên kênh + group
- Khi `isSidebarVisible = true`: hiển thị ChannelSidebar bên phải với `AnimatedVisibility(enter = slideInHorizontally, exit = slideOutHorizontally)`

**PlayerControls.kt:**

```kotlin
@Composable
fun PlayerControls(
    isPaused: Boolean,
    onTogglePlay: () -> Unit,
    onToggleFullscreen: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(modifier.fillMaxSize()) {
        // Center play icon khi paused
        if (isPaused) {
            IconButton(onClick = onTogglePlay, modifier = Modifier.align(Alignment.Center).size(64.dp)) {
                Icon(Icons.Default.PlayArrow, "Play", tint = Color.White, modifier = Modifier.fillMaxSize())
            }
        }
        // Fullscreen button bottom-right
        IconButton(onClick = onToggleFullscreen, modifier = Modifier.align(Alignment.BottomEnd).padding(16.dp)) {
            Icon(Icons.Default.Fullscreen, "Fullscreen", tint = Color.White)
        }
        // Loading spinner
        var loading by remember { mutableStateOf(true) }
        // ... set loading false khi player prepare xong
        if (loading) {
            CircularProgressIndicator(modifier = Modifier.align(Alignment.Center), color = Color.White)
        }
    }
}
```

### 11. Sidebar (ui/sidebar/ChannelSidebar.kt)

```kotlin
@Composable
fun ChannelSidebar(
    channels: List<Channel>,
    currentChannelId: String?,
    onChannelClick: (Channel) -> Unit,
    onClose: () -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxHeight().width(300.dp),
        color = MaterialTheme.colorScheme.surface,
        tonalElevation = 4.dp
    ) {
        Column {
            // Header
            Row(Modifier.padding(12.dp).fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Danh sách kênh", style = MaterialTheme.typography.titleSmall)
                IconButton(onClick = onClose) { Icon(Icons.Default.Close, "Đóng") }
            }
            // Search
            var query by remember { mutableStateOf("") }
            OutlinedTextField(
                value = query, onValueChange = { query = it },
                modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp),
                placeholder = { Text("Tìm kênh...") },
                singleLine = true, leadingIcon = { Icon(Icons.Default.Search, "") },
                colors = OutlinedTextFieldDefaults.colors()
            )
            // Count
            val filtered = if (query.isBlank()) channels else channels.filter {
                it.name.contains(query, true) || it.group.contains(query, true)
            }
            Text("${filtered.size} / ${channels.size} kênh",
                style = MaterialTheme.typography.labelSmall,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            // List
            LazyColumn(modifier = Modifier.weight(1f)) {
                items(filtered) { channel ->
                    val isActive = channel.id == currentChannelId
                    ChannelListItem(
                        channel = channel,
                        isActive = isActive,
                        onClick = { onChannelClick(channel) }
                    )
                }
            }
        }
    }
}

@Composable
fun ChannelListItem(channel: Channel, isActive: Boolean, onClick: () -> Unit) {
    Surface(
        onClick = onClick,
        color = if (isActive) MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f)
                else Color.Transparent
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .then(if (isActive) Modifier.padding(start = 4.dp) else Modifier)
                .padding(horizontal = 12.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            AsyncImage(
                model = channel.logo.ifEmpty { null },
                contentDescription = null,
                modifier = Modifier.size(36.dp),
                error = painterResource(R.drawable.ic_tv)
            )
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(channel.name, style = MaterialTheme.typography.bodyMedium,
                    maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(channel.group, style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
            if (isActive) {
                Box(Modifier.width(4.dp).fillMaxHeight().background(MaterialTheme.colorScheme.primary))
            }
        }
    }
}
```

### 12. Settings (ui/settings/)

**SettingsViewModel.kt:**

```kotlin
@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val repository: PlaylistRepository
) : ViewModel() {
    data class SettingsUiState(
        val defaultUrl: String = "",
        val allPlaylists: List<PlaylistMeta> = emptyList(),
        val isReloading: Boolean = false
    )
    private val _uiState = MutableStateFlow(SettingsUiState())
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()

    init {
        _uiState.update { it.copy(defaultUrl = repository.getDefaultLink()) }
        viewModelScope.launch {
            repository.getAllPlaylists().collect { list ->
                _uiState.update { it.copy(allPlaylists = list) }
            }
        }
    }

    fun saveDefaultLink(url: String) { repository.setDefaultLink(url) }
    fun clearDefaultLink() { repository.clearDefaultLink(); _uiState.update { it.copy(defaultUrl = "") } }
    fun loadPlaylist(id: String) { repository.setActivePlaylistId(id) }
    fun deletePlaylist(id: String) { viewModelScope.launch { repository.deletePlaylist(id) } }
    fun reloadFromDefault() {
        viewModelScope.launch {
            _uiState.update { it.copy(isReloading = true) }
            try { repository.fetchAndSaveFromUrl(repository.getDefaultLink()) }
            catch (e: Exception) { /* toast */ }
            finally { _uiState.update { it.copy(isReloading = false) } }
        }
    }
}
```

**SettingsScreen.kt:**

- Scaffold với topAppBar "Cài đặt" + back button
- Card "Nguồn playlist mặc định":
  - OutlinedTextField + nút "Lưu"
  - Nút "Tải lại từ link" + nút "Xoá"
- Card "Giao diện": 3 nút "Tối", "Sáng", "Hệ thống"
- Card "Danh sách kênh đã lưu":
  - LazyColumn playlist items, mỗi item: tên + số kênh + ngày + icon xoá

### 13. Home (ui/home/)

**HomeViewModel.kt:**

```kotlin
@HiltViewModel
class HomeViewModel @Inject constructor(
    private val repository: PlaylistRepository
) : ViewModel() {
    data class HomeUiState(
        val loading: Boolean = true,
        val firstChannelId: String? = null,
        val playlists: List<PlaylistMeta> = emptyList()
    )
    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    val defaultLink: String get() = repository.getDefaultLink()

    init {
        viewModelScope.launch {
            val activeId = repository.getActivePlaylistId()
            if (activeId != null) {
                val chId = repository.resolveDefaultChannel(activeId)
                _uiState.update { it.copy(loading = false, firstChannelId = chId) }
                return@launch
            }
            val link = repository.getDefaultLink()
            if (link.isNotEmpty() && !repository.isAutoLoaded()) {
                repository.setAutoLoaded(true)
                try { repository.fetchAndSaveFromUrl(link) }
                catch (_: Exception) { _uiState.update { it.copy(loading = false) }; return@launch }
                val id = repository.getActivePlaylistId() ?: return@launch
                val chId = repository.resolveDefaultChannel(id)
                _uiState.update { it.copy(loading = false, firstChannelId = chId) }
            } else {
                _uiState.update { it.copy(loading = false) }
            }
        }
    }

    fun fetchAndNavigate(url: String, onDone: (String) -> Unit) {
        viewModelScope.launch {
            _uiState.update { it.copy(loading = true) }
            try {
                repository.fetchAndSaveFromUrl(url)
                val id = repository.getActivePlaylistId() ?: return@launch
                val chId = repository.resolveDefaultChannel(id) ?: return@launch
                onDone(chId)
            } catch (_: Exception) { }
            _uiState.update { it.copy(loading = false) }
        }
    }
}
```

**HomeScreen.kt:**

- Loading: hiển thị spinner + "Đang tải danh sách kênh..."
- Nếu `firstChannelId != null`: LaunchedEffect navigate
- Upload form: URL input + button "Tải", file picker
- Recent playlists list

### 14. MainActivity.kt

```kotlin
@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            TiviTheme { TiviNavGraph() }
        }
    }
}
```

### 15. TiviApplication.kt

```kotlin
@HiltAndroidApp
class TiviApplication : Application()
```

### 16. AndroidManifest.xml

```xml
<uses-permission android:name="android.permission.INTERNET" />

<application
    android:name=".TiviApplication"
    android:usesCleartextTraffic="true"
    android:theme="@style/Theme.Tivi">

    <activity
        android:name=".MainActivity"
        android:exported="true"
        android:windowSoftInputMode="adjustResize">
        <intent-filter>
            <action android:name="android.intent.action.MAIN" />
            <category android:name="android.intent.category.LAUNCHER" />
        </intent-filter>
    </activity>
</application>
```

### 17. build.gradle.kts (app)

```kotlin
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("kotlin-kapt")
    id("com.google.dagger.hilt.android")
}

android {
    namespace = "com.tivi.app"
    compileSdk = 35
    defaultConfig {
        applicationId = "com.tivi.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"
    }
    buildFeatures { compose = true }
    composeOptions { kotlinCompilerExtensionVersion = "1.5.15" }
    kotlinOptions { jvmTarget = "17" }
}

dependencies {
    // Compose BOM
    val composeBom = platform("androidx.compose:compose-bom:2024.12.01")
    implementation(composeBom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-core")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.7")
    implementation("androidx.navigation:navigation-compose:2.8.5")

    // Media3 ExoPlayer
    implementation("androidx.media3:media3-exoplayer:1.5.1")
    implementation("androidx.media3:media3-exoplayer-hls:1.5.1")
    implementation("androidx.media3:media3-ui:1.5.1")

    // Room
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    kapt("androidx.room:room-compiler:2.6.1")

    // Hilt
    implementation("com.google.dagger:hilt-android:2.53.1")
    kapt("com.google.dagger:hilt-compiler:2.53.1")
    implementation("androidx.hilt:hilt-navigation-compose:1.2.0")

    // Networking
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.retrofit2:retrofit:2.11.0")

    // Image
    implementation("io.coil-kt:coil-compose:2.7.0")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")

    // Core
    implementation("androidx.core:core-ktx:1.15.0")
}
```

## Luồng hoạt động

1. App khởi động → HomeViewModel kiểm tra SharedPreferences
2. Nếu có active playlist ID → resolve VTV1 → navigate PlayerScreen
3. Nếu chưa có → fetch từ default link
4. Parse M3U → lưu Room → find VTV1 → navigate PlayerScreen
5. PlayerScreen: ExoPlayer phát stream, custom controls không hiện progress bar
6. Sidebar bên phải: tap icon để hiện danh sách
7. Settings: đổi link default, quản lý playlist

## Lưu ý

- Minimum SDK 26, Target SDK 35, compileSdk 35
- Kotlin 2.0+, dùng `id("org.jetbrains.kotlin.android")` version 2.0.21
- `id("com.google.dagger.hilt.android")` version 2.53.1
- Ẩn hoàn toàn ExoPlayer default controls (`useController = false`)
- Xử lý lifecycle: `remember` ExoPlayer, release trong `DisposableEffect`
- Adaptive icon (res/mipmap-anydpi-v26/)
- res/values/strings.xml: app_name = "Tivi"
- res/drawable/ic_tv.xml: vector icon hình TV
- Theme: `res/values/themes.xml` với Theme.Material3.DarkNoActionBar
