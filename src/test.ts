import { CacheManager, default_cache_manager } from "./managers";

interface TestObject {
    test: boolean;
    test1: null;
}
const cache_manager = CacheManager.get_instance<TestObject>();

default_cache_manager.set("testss", "true ddd");
const test = cache_manager.get("testss");
console.log("test", test);
console.log("test2", cache_manager.get("test"));

/// set
cache_manager.set("test", true);
// cache_manager.set("test", "true");

cache_manager.set("test2", null);
cache_manager.set("test2", "null");
cache_manager.set("test2", [null]);

/// get
const test1 = cache_manager.get("test", true);
const test2 = cache_manager.get("tests", [true]);

// const test2 = cache_manager.get("testss", true as boolean);

const test3 = cache_manager.get("test2");
